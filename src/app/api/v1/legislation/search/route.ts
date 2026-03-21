import { NextRequest } from "next/server";
import { searchBills, getBills, getBill, CongressApiError, getCurrentCongress } from "@/lib/congress-api";
import { getOrFetch, buildCacheKey, CacheTTL } from "@/lib/cache";
import { Bill } from "@/types/congress";
import { createLogger } from "@/lib/logger";
import { jsonError, jsonSuccess } from "@/lib/api-response";

/** Score a bill title against the search query; higher = more relevant. */
function scoreBill(bill: Bill, query: string, queryWords: string[]): number {
  const title = (bill.title ?? "").toLowerCase();
  if (title === query) return 100;
  if (title.startsWith(query)) return 90;
  if (title.includes(query)) return 80;
  const matched = queryWords.filter((w) => title.includes(w)).length;
  if (matched === 0) return 0;
  return Math.round((matched / queryWords.length) * 70);
}

/** Re-rank bills so that title-matching results surface first.
 *  Bills with equal relevance are sub-sorted by updateDate descending
 *  so the most recently active bill appears first within each tier. */
function rankBills(bills: Bill[], query: string): Bill[] {
  const q = query.toLowerCase().trim();
  const qWords = q.split(/\s+/).filter(Boolean);
  return [...bills].sort((a, b) => {
    const scoreDiff = scoreBill(b, q, qWords) - scoreBill(a, q, qWords);
    if (scoreDiff !== 0) return scoreDiff;
    // Secondary sort: most recently updated first
    const aDate = a.updateDate ? new Date(a.updateDate).getTime() : 0;
    const bDate = b.updateDate ? new Date(b.updateDate).getTime() : 0;
    return bDate - aDate;
  });
}

/** Strip punctuation so "Protecting our Communities..." still matches without perfect spelling. */
function normalizeQuery(q: string): string {
  return q
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Fetch this many bills from Congress.gov per keyword search so ranking has a
// representative sample. Congress.gov's default ordering (updateDate desc) does
// not sort by relevance, so fetching only 8 would miss a bill titled exactly
// "SAVE Act" if it happened to be the 15th result by date.
const SEARCH_FETCH_LIMIT = 100;

/** Bill number patterns for direct lookup (e.g. "HR 1234", "S 5", "H.J.Res 45"). */
const BILL_NUMBER_PATTERNS: Array<{ regex: RegExp; type: string }> = [
  { regex: /^h\.?r\.?\s*(\d+)$/i, type: "hr" },
  { regex: /^s\.?\s*(\d+)$/i, type: "s" },
  { regex: /^h\.?j\.?\s*res\.?\s*(\d+)$/i, type: "hjres" },
  { regex: /^s\.?j\.?\s*res\.?\s*(\d+)$/i, type: "sjres" },
  { regex: /^h\.?\s*con\.?\s*res\.?\s*(\d+)$/i, type: "hconres" },
  { regex: /^s\.?\s*con\.?\s*res\.?\s*(\d+)$/i, type: "sconres" },
  { regex: /^h\.?\s*res\.?\s*(\d+)$/i, type: "hres" },
  { regex: /^s\.?\s*res\.?\s*(\d+)$/i, type: "sres" },
];

function parseBillNumber(q: string): { type: string; number: string } | null {
  for (const { regex, type } of BILL_NUMBER_PATTERNS) {
    const m = q.trim().match(regex);
    if (m) return { type, number: m[1] };
  }
  return null;
}

/** Deduplicate bills by congress+type+number, keeping first occurrence. */
function deduplicateBills(bills: Bill[]): Bill[] {
  const seen = new Set<string>();
  return bills.filter((bill) => {
    const key = `${bill.congress}-${bill.type}-${bill.number}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const logger = createLogger("LegislationSearchAPI");

interface SearchResponse {
  bills: Bill[];
  count: number;
  query: string;
}

interface RankedBatch {
  rankedBills: Bill[];
  fetchedCount: number; // total count reported by the Congress.gov API
}

/**
 * Legislation search API
 * GET /api/v1/legislation/search?q=<query>&limit=<n>&offset=<n>
 *
 * When q is provided:
 *   - If q matches a bill number pattern (e.g. "HR 1234"), performs a direct lookup first
 *   - Otherwise fetches up to SEARCH_FETCH_LIMIT bills from Congress.gov (cached per query)
 *   - Deduplicates results before re-ranking by title relevance
 *   - All "Load More" pages read from the same ranked cache — no extra API calls
 *
 * When q is omitted, returns recent bills ordered by updateDate desc.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get("q")?.trim() ?? "";
    const limit = Math.min(Number(searchParams.get("limit")) || 8, 50);
    const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);
    const congress = getCurrentCongress();

    if (q.length > 200) {
      return jsonError("Query too long", 400);
    }

    if (q.length >= 2) {
      // Direct bill number lookup (e.g. "HR 1234", "S 5", "H.J.Res 45").
      // Bypasses full-text search for precise, user-intent-matching results.
      const billRef = parseBillNumber(q);
      if (billRef) {
        const directCacheKey = buildCacheKey(
          "legislation",
          "direct",
          `${congress}-${billRef.type}-${billRef.number}`,
        );
        const directResult = await getOrFetch<SearchResponse>(
          directCacheKey,
          async () => {
            try {
              const bill = await getBill(billRef.type, billRef.number, congress);
              return { bills: [bill], count: 1, query: q };
            } catch {
              // Bill not found — return empty so caller falls through to text search
              return { bills: [], count: 0, query: q };
            }
          },
          CacheTTL.LEGISLATIVE_DATA,
        );

        if (directResult.data && directResult.data.bills.length > 0) {
          return jsonSuccess(directResult.data, {
            headers: {
              "X-Cache-Status": directResult.status,
              "X-Cache-Stale": directResult.isStale ? "true" : "false",
              ...(directResult.age !== undefined && { "X-Cache-Age": directResult.age.toString() }),
            },
          });
        }
        // Fall through to text search if direct lookup found nothing
      }

      // Cache the full ranked batch keyed by query only (not per-page).
      // Pagination is applied after cache retrieval so all pages share one API call.
      const rankCacheKey = buildCacheKey(
        "legislation",
        "ranked",
        `${congress}-${encodeURIComponent(q.toLowerCase())}`,
      );

      const batchResult = await getOrFetch<RankedBatch>(
        rankCacheKey,
        async () => {
          const response = await searchBills(q, { limit: SEARCH_FETCH_LIMIT, offset: 0, congress });
          let bills = deduplicateBills(response.bills ?? []);
          const fetchedCount = response.pagination?.count ?? bills.length;

          // Fuzzy fallback: if no results and query has punctuation, try normalized form
          if (bills.length === 0) {
            const normalized = normalizeQuery(q);
            if (normalized !== q && normalized.length >= 2) {
              const fallback = await searchBills(normalized, {
                limit: SEARCH_FETCH_LIMIT,
                offset: 0,
                congress,
              });
              bills = deduplicateBills(fallback.bills ?? []);
            }
          }

          return { rankedBills: rankBills(bills, q), fetchedCount };
        },
        CacheTTL.LEGISLATIVE_DATA,
      );

      if (!batchResult.data) {
        return jsonError("Failed to search legislation", 500);
      }

      const { rankedBills, fetchedCount } = batchResult.data;
      const pageBills = rankedBills.slice(offset, offset + limit);
      // Report the smaller of Congress.gov's total count and our fetched batch,
      // so the client doesn't try to paginate beyond what we've ranked.
      const count = Math.min(fetchedCount, rankedBills.length);

      return jsonSuccess(
        { bills: pageBills, count, query: q },
        {
          headers: {
            "X-Cache-Status": batchResult.status,
            "X-Cache-Stale": batchResult.isStale ? "true" : "false",
            ...(batchResult.age !== undefined && { "X-Cache-Age": batchResult.age.toString() }),
          },
        },
      );
    }

    // No query — return recent bills with offset-based pagination
    const recentCacheKey = buildCacheKey(
      "legislation",
      "search",
      `${congress}-recent-${limit}-${offset}`,
    );

    const recentResult = await getOrFetch<SearchResponse>(
      recentCacheKey,
      async () => {
        const response = await getBills({ limit, offset, sort: "updateDate+desc" });
        const bills = deduplicateBills(response.bills ?? []);
        const count = response.pagination?.count ?? bills.length;
        return { bills, count, query: q };
      },
      CacheTTL.LEGISLATIVE_DATA,
    );

    if (!recentResult.data) {
      return jsonError("Failed to search legislation", 500);
    }

    return jsonSuccess(recentResult.data, {
      headers: {
        "X-Cache-Status": recentResult.status,
        "X-Cache-Stale": recentResult.isStale ? "true" : "false",
        ...(recentResult.age !== undefined && { "X-Cache-Age": recentResult.age.toString() }),
      },
    });
  } catch (error) {
    logger.error("Legislation search error:", error);

    if (error instanceof CongressApiError) {
      return jsonError(error.message, error.statusCode || 500);
    }

    return jsonError("Failed to search legislation", 500);
  }
}
