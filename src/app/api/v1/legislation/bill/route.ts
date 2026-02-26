import { NextRequest } from "next/server";
import { getBill, getBillSummaries, CongressApiError, getCurrentCongress } from "@/lib/congress-api";
import { getOrFetch, buildCacheKey, CacheTTL } from "@/lib/cache";
import { Bill } from "@/types/congress";
import { createLogger } from "@/lib/logger";
import { jsonError, jsonSuccess } from "@/lib/api-response";

const logger = createLogger("BillDetailsAPI");

/**
 * Bill details API endpoint
 * Returns detailed information about a specific bill including summaries
 *
 * Query params:
 * - type: bill type (HR, S, HJRES, etc.)
 * - number: bill number
 * - congress: congress number (optional, defaults to current)
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const billType = searchParams.get("type");
    const billNumber = searchParams.get("number");
    const congress = Number(searchParams.get("congress")) || getCurrentCongress();

    if (!billType || !billNumber) {
      return jsonError("Bill type and number parameters are required", 400);
    }

    const cacheKey = buildCacheKey("congress", "bill-full", `${congress}-${billType}-${billNumber}`);

    const fetchBillDetails = async (): Promise<Bill> => {
      const bill = await getBill(billType, billNumber, congress);

      try {
        const summariesResponse = await getBillSummaries(billType, billNumber, congress);
        if (summariesResponse.summaries && summariesResponse.summaries.length > 0) {
          bill.summaries = summariesResponse.summaries;
        }
      } catch (error) {
        logger.warn("Failed to fetch bill summaries:", error);
      }

      return bill;
    };

    const cached = await getOrFetch<Bill>(cacheKey, fetchBillDetails, CacheTTL.LEGISLATIVE_DATA);

    if (!cached.data) {
      return jsonError("Failed to fetch bill details", 500);
    }

    return jsonSuccess(cached.data, {
      headers: {
        "X-Cache-Status": cached.status,
        "X-Cache-Stale": cached.isStale ? "true" : "false",
        ...(cached.age !== undefined && { "X-Cache-Age": cached.age.toString() }),
      },
    });
  } catch (error) {
    logger.error("Bill details API error:", error);

    if (error instanceof CongressApiError) {
      return jsonError(error.message, error.statusCode || 500, {
        statusCode: error.statusCode,
      });
    }

    return jsonError("Failed to fetch bill details", 500);
  }
}
