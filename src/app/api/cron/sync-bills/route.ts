import { NextRequest } from "next/server";
import { getBills, CongressApiError } from "@/lib/congress-api";
import { upsertBills } from "@/lib/bill-index";
import { createLogger } from "@/lib/logger";
import { jsonError, jsonSuccess } from "@/lib/api-response";

const logger = createLogger("SyncBillsCron");

// 2-hour lookback gives a 1-hour overlap buffer so no bills are missed
// between consecutive hourly runs.
const LOOKBACK_HOURS = 2;
const BATCH_SIZE = 250;

/**
 * Incremental bill index sync
 * GET /api/cron/sync-bills
 *
 * Fetches bills updated in the last 48 hours from Congress.gov and upserts
 * them into the bill_index MongoDB collection used for title search.
 * Runs hourly via vercel.json.
 */
export async function GET(request: NextRequest) {
  logger.info("Sync bills cron started", { timestamp: new Date().toISOString() });

  const stats = { fetched: 0, upserted: 0, errors: 0 };

  try {
    const fromDate = new Date(Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000);
    // Congress.gov expects ISO 8601 without milliseconds: 2025-01-15T00:00:00Z
    const fromDateTime = fromDate.toISOString().replace(/\.\d+Z$/, "Z");

    const response = await getBills({
      limit: BATCH_SIZE,
      offset: 0,
      sort: "updateDate+desc",
      fromDateTime,
    });

    const bills = response.bills ?? [];
    stats.fetched = bills.length;

    if (bills.length > 0) {
      stats.upserted = await upsertBills(bills);
    }

    logger.info("Sync bills cron complete", stats);
    return jsonSuccess({ message: "Bill index synced", stats });
  } catch (error) {
    logger.error("Sync bills cron error:", error);
    stats.errors++;

    if (error instanceof CongressApiError) {
      return jsonError(error.message, error.statusCode || 500, { stats });
    }

    return jsonError("Failed to sync bill index", 500, { stats });
  }
}
