import { NextRequest } from "next/server";
import { getBills, getBillTitles, CongressApiError } from "@/lib/congress-api";
import { upsertBills, upsertBillShortTitles } from "@/lib/bill-index";
import { createLogger } from "@/lib/logger";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { verifyCronSecret } from "@/lib/cron-auth";

const logger = createLogger("SyncBillsCron");

// 26-hour lookback gives a 2-hour overlap buffer so no bills are missed
// between consecutive daily runs (cron fires at 04:00 UTC each day).
const LOOKBACK_HOURS = 26;
const BATCH_SIZE = 250;

/**
 * Incremental bill index sync
 * GET /api/cron/sync-bills
 *
 * Fetches bills updated in the last 2 hours from Congress.gov, upserts them
 * into bill_index, then enriches each bill with its short titles (e.g. "SAVE Act")
 * from the /titles endpoint. Short titles are what allows popular-name searches
 * to work — they are not included in the list response.
 */
export async function GET(request: NextRequest) {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  logger.info("Sync bills cron started", { timestamp: new Date().toISOString() });

  const stats = { fetched: 0, upserted: 0, titlesEnriched: 0, errors: 0 };

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

      // Enrich each bill with short titles from the /titles endpoint.
      // Failures are counted but do not abort the sync.
      const titleResults = await Promise.allSettled(
        bills.map(async (bill) => {
          const titles = await getBillTitles(bill.type, bill.number, bill.congress);
          await upsertBillShortTitles(bill.type, bill.number, bill.congress, titles);
        }),
      );

      stats.titlesEnriched = titleResults.filter((r) => r.status === "fulfilled").length;
      stats.errors = titleResults.filter((r) => r.status === "rejected").length;

      if (stats.errors > 0) {
        logger.warn(`Short title enrichment failed for ${stats.errors} bills`);
      }
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
