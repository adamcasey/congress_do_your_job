import { NextRequest } from "next/server";
import { searchBills, getBills, CongressApiError, getCurrentCongress } from "@/lib/congress-api";
import { getOrFetch, buildCacheKey, CacheTTL } from "@/lib/cache";
import { Bill } from "@/types/congress";
import { createLogger } from "@/lib/logger";
import { jsonError, jsonSuccess } from "@/lib/api-response";

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
