import { NextRequest } from "next/server";
import { getBills, CongressApiError, getCurrentCongress } from "@/lib/congress-api";
import { setCached, buildCacheKey, CacheTTL } from "@/lib/cache";
import { upsertBills } from "@/lib/bill-index";
import { Bill } from "@/types/congress";
import { createLogger } from "@/lib/logger";
import { jsonError, jsonSuccess } from "@/lib/api-response";

const logger = createLogger("RefreshLegislationCron");

// Matches the page size used by the /legislation UI (useLegislationSearch hook)
const UI_PAGE_SIZE = 8;

// How many bills to fetch per run. 96 = 12 pages × 8 bills.
// One Congress.gov request covers all pages so users browsing /legislation
// always hit a pre-warmed cache after the nightly refresh.
const FETCH_LIMIT = 96;

interface PagedSearchResponse {
  bills: Bill[];
  count: number;
  query: string;
}

/**
 * Nightly legislation cache refresh
 * GET /api/cron/refresh-legislation
 *
 * Fetches the most recently active bills from Congress.gov and pre-warms
 * the Redis cache for every page of the /legislation default (no-query) view.
 * Runs at 05:00 UTC (midnight US Eastern Standard Time) via vercel.json.
 */
export async function GET(request: NextRequest) {
  logger.info("Cron job started", {
    userAgent: request.headers.get("user-agent"),
    timestamp: new Date().toISOString(),
  });

  const stats = {
    billsFetched: 0,
    pagesCached: 0,
    billsIndexed: 0,
    errors: 0,
  };

  try {
    const congress = getCurrentCongress();

    const response = await getBills({
      limit: FETCH_LIMIT,
      offset: 0,
      sort: "updateDate+desc",
    });

    const bills = response.bills ?? [];
    const totalCount = response.pagination?.count ?? bills.length;
    stats.billsFetched = bills.length;

    if (bills.length === 0) {
      logger.warn("No bills returned from Congress.gov");
      return jsonSuccess({ message: "No bills returned", stats });
    }

    // Keep the bill_index in sync so title search stays fresh.
    try {
      stats.billsIndexed = await upsertBills(bills);
    } catch (indexError) {
      logger.warn("bill_index upsert failed (non-fatal):", indexError);
      stats.errors++;
    }

    // Split the fetched bills into UI pages and write each page to cache.
    // The search route reads from keys built by buildCacheKey("legislation", "search",
    // `{congress}-recent-{limit}-{offset}`) — we reproduce the exact same keys here.
    for (let offset = 0; offset < bills.length; offset += UI_PAGE_SIZE) {
      const pageBills = bills.slice(offset, offset + UI_PAGE_SIZE);
      if (pageBills.length === 0) break;

      const cacheKey = buildCacheKey(
        "legislation",
        "search",
        `${congress}-recent-${UI_PAGE_SIZE}-${offset}`,
      );

      const pageData: PagedSearchResponse = {
        bills: pageBills,
        count: totalCount,
        query: "",
      };

      const ok = await setCached(cacheKey, pageData, CacheTTL.LEGISLATIVE_DATA);
      if (ok) {
        stats.pagesCached++;
      } else {
        stats.errors++;
        logger.warn(`Failed to cache page at offset ${offset}`);
      }
    }

    logger.info("Legislation cache refresh complete", stats);

    return jsonSuccess({
      message: "Legislation cache refreshed",
      stats,
    });
  } catch (error) {
    logger.error("Cron job error:", error);
    stats.errors++;

    if (error instanceof CongressApiError) {
      return jsonError(error.message, error.statusCode || 500, { stats });
    }

    return jsonError("Failed to refresh legislation cache", 500, { stats });
  }
}
