import { NextRequest } from "next/server";
import { getBills, getBill, getBillTitles, CongressApiError, getCurrentCongress } from "@/lib/congress-api";
import { searchBillsByTitle, upsertBillShortTitles } from "@/lib/bill-index";
import { getOrFetch, buildCacheKey, CacheTTL } from "@/lib/cache";
import { Bill } from "@/types/congress";
import { createLogger } from "@/lib/logger";
import { jsonError, jsonSuccess } from "@/lib/api-response";

/**
 * Words so common in bill titles that they should not influence relevance scoring.
 * Counting "act", "of", or "a" as meaningful query words would dilute per-word
 * scores and make unrelated bills appear equally relevant.
 */
const TITLE_STOP_WORDS = new Set([
  "a", "an", "the", "of", "to", "and", "or", "for", "in", "on", "at", "by",
  "with", "act", "bill", "resolution",
]);

/**
 * Returns true if `acronym` matches the initial letters of consecutive tokens
 * in `titleTokens`. For example, "save" matches ["safeguard","american","voter","eligibility"].
 */
function isAcronymOf(acronym: string, titleTokens: string[]): boolean {
  if (acronym.length < 2 || acronym.length > titleTokens.length) return false;
  for (let start = 0; start <= titleTokens.length - acronym.length; start++) {
    const initials = titleTokens.slice(start, start + acronym.length).map((t) => t[0]).join("");
    if (initials === acronym) return true;
  }
  return false;
}

/**
 * Score a bill against the search query; higher = more relevant.
 *
 * Scoring tiers (descending priority):
 *   100 – exact official title match
 *    95 – exact short title / popular name match  (mirrors Congress.gov's 10x weight on shortTitles)
 *    90 – official title starts with query phrase
 *    85 – short title contains query phrase
 *    80 – official title contains query phrase
 *  1–70 – word-level: proportion of significant query words found in any title
 *          exact word match > word-prefix match (e.g. "veteran" ≈ "veterans")
 *          acronym match (e.g. "save" → Safeguard American Voter Eligibility)
 */
function scoreBill(bill: Bill, query: string, queryWords: string[]): number {
  const title = (bill.title ?? "").toLowerCase();
  const shortTitles = (bill.shortTitles ?? []).map((t) => t.toLowerCase());

  if (title === query) return 100;
  if (shortTitles.some((st) => st === query)) return 95;
  if (title.startsWith(query)) return 90;
  if (shortTitles.some((st) => st.includes(query))) return 85;
  if (title.includes(query)) return 80;

  const significant = queryWords.filter((w) => w.length >= 2 && !TITLE_STOP_WORDS.has(w));
  const matchWords = significant.length > 0 ? significant : queryWords;
  if (matchWords.length === 0) return 0;

  // Tokenize all title surfaces (official + short titles) for word-level matching
  const tokenize = (s: string) => s.split(/[\s\-–,;:()[\]{}'"]+/).filter(Boolean);
  const allTokens = [
    ...tokenize(title),
    ...shortTitles.flatMap(tokenize),
  ];

  let score = 0;
  for (const qw of matchWords) {
    if (allTokens.some((tw) => tw === qw)) {
      score += 1;
    } else if (allTokens.some((tw) => tw.startsWith(qw) || (qw.startsWith(tw) && tw.length >= 4))) {
      score += 0.6;
    } else if (isAcronymOf(qw, tokenize(title))) {
      score += 0.9;
    }
  }

  if (score === 0) return 0;
  return Math.max(1, Math.round((score / matchWords.length) * 70));
}

/** Re-rank bills so that title-matching results surface first.
 *  Bills with equal relevance are sub-sorted by updateDate descending. */
function rankBills(bills: Bill[], query: string): Bill[] {
  const q = query.toLowerCase().trim();
  const qWords = q.split(/\s+/).filter(Boolean);
  return [...bills].sort((a, b) => {
    const scoreDiff = scoreBill(b, q, qWords) - scoreBill(a, q, qWords);
    if (scoreDiff !== 0) return scoreDiff;
    const aDate = a.updateDate ? new Date(a.updateDate).getTime() : 0;
    const bDate = b.updateDate ? new Date(b.updateDate).getTime() : 0;
    return bDate - aDate;
  });
}

/** Strip punctuation so queries like "Protecting our Communities..." still match cleanly. */
function normalizeQuery(q: string): string {
  return q
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

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
  fetchedCount: number;
}

/**
 * Legislation search API
 * GET /api/v1/legislation/search?q=<query>&limit=<n>&offset=<n>
 *
 * When q is provided:
 *   - If q matches a bill number pattern (e.g. "HR 1234"), performs a direct
 *     Congress.gov lookup first.
 *   - Otherwise queries the local bill_index MongoDB collection by title.
 *     Results are re-ranked with scoreBill() so exact title matches surface first.
 *   - All "Load More" pages read from the same Redis-cached ranked batch —
 *     no repeated DB queries per page.
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
      // 1. Direct bill number lookup (e.g. "HR 1234", "S 5", "H.J.Res 45").
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
              // Fire-and-forget: store short titles so future title searches find this bill
              getBillTitles(billRef.type, billRef.number, congress)
                .then((titles) => upsertBillShortTitles(billRef.type, billRef.number, congress, titles))
                .catch(() => {}); // non-critical — don't block the response
              return { bills: [bill], count: 1, query: q };
            } catch {
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
        // Fall through to title search if bill number not found
      }

      // 2. Title search via local bill_index MongoDB collection.
      const normalizedQ = normalizeQuery(q.toLowerCase());
      const searchQuery = normalizedQ.length >= 2 ? normalizedQ : q;

      // Cache the full ranked batch keyed by query only (not per-page).
      // All "Load More" pages slice from this same cached array.
      const rankCacheKey = buildCacheKey(
        "legislation",
        "ranked",
        `${congress}-${encodeURIComponent(searchQuery)}`,
      );

      const batchResult = await getOrFetch<RankedBatch>(
        rankCacheKey,
        async () => {
          const bills = await searchBillsByTitle(searchQuery, 100);
          const deduped = deduplicateBills(bills);
          return { rankedBills: rankBills(deduped, q), fetchedCount: deduped.length };
        },
        CacheTTL.LEGISLATIVE_DATA,
      );

      if (!batchResult.data) {
        return jsonError("Failed to search legislation", 500);
      }

      const { rankedBills, fetchedCount } = batchResult.data;
      const pageBills = rankedBills.slice(offset, offset + limit);

      return jsonSuccess(
        { bills: pageBills, count: fetchedCount, query: q },
        {
          headers: {
            "X-Cache-Status": batchResult.status,
            "X-Cache-Stale": batchResult.isStale ? "true" : "false",
            ...(batchResult.age !== undefined && { "X-Cache-Age": batchResult.age.toString() }),
          },
        },
      );
    }

    // 3. No query — return recent bills with offset-based pagination.
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
