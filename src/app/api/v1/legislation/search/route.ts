import { NextRequest } from "next/server";
import { searchBills, getBills, CongressApiError, getCurrentCongress } from "@/lib/congress-api";
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

/** Re-rank bills so that title-matching results surface first. */
function rankBills(bills: Bill[], query: string): Bill[] {
  const q = query.toLowerCase().trim();
  const qWords = q.split(/\s+/).filter(Boolean);
  return [...bills].sort((a, b) => scoreBill(b, q, qWords) - scoreBill(a, q, qWords));
}

/** Strip punctuation so "Protecting our Communities..." still matches without perfect spelling. */
function normalizeQuery(q: string): string {
  return q
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const logger = createLogger("LegislationSearchAPI");

interface SearchResponse {
  bills: Bill[];
  count: number;
  query: string;
}

/**
 * Legislation search API
 * GET /api/v1/legislation/search?q=<query>&limit=<n>
 *
 * When q is provided, searches Congress.gov by keyword.
 * When q is omitted, returns recent bills (acts as recent feed).
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

    const cacheKey = buildCacheKey(
      "legislation",
      "search",
      `${congress}-${encodeURIComponent(q.toLowerCase())}-${limit}-${offset}`,
    );

    const fetcher = async (): Promise<SearchResponse> => {
      let bills: Bill[] = [];
      let count = 0;

      if (q.length >= 2) {
        const response = await searchBills(q, { limit, offset, congress });
        bills = response.bills ?? [];
        count = response.pagination?.count ?? bills.length;

        // Fuzzy fallback: if no results and query has punctuation, try normalized form
        if (bills.length === 0) {
          const normalized = normalizeQuery(q);
          if (normalized !== q && normalized.length >= 2) {
            const fallback = await searchBills(normalized, { limit, offset, congress });
            bills = fallback.bills ?? [];
            count = fallback.pagination?.count ?? bills.length;
          }
        }

        bills = rankBills(bills, q);
      } else {
        const response = await getBills({ limit, offset, sort: "updateDate+desc" });
        bills = response.bills ?? [];
        count = response.pagination?.count ?? bills.length;
      }

      return { bills, count, query: q };
    };

    const result = await getOrFetch<SearchResponse>(cacheKey, fetcher, CacheTTL.LEGISLATIVE_DATA);

    if (!result.data) {
      return jsonError("Failed to search legislation", 500);
    }

    return jsonSuccess(result.data, {
      headers: {
        "X-Cache-Status": result.status,
        "X-Cache-Stale": result.isStale ? "true" : "false",
        ...(result.age !== undefined && { "X-Cache-Age": result.age.toString() }),
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
