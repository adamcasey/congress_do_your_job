import { getCollection } from "@/lib/mongodb";
import { type FundPledgeDocument } from "@/lib/stripe";
import { getCached, setCached, buildCacheKey, CacheTTL } from "@/lib/cache";
import { jsonSuccess, jsonError } from "@/lib/api-response";
import { createLogger } from "@/lib/logger";
import type { FundStatsResponse } from "@/types/fund";

const logger = createLogger("FundStatsAPI");

const CACHE_KEY = buildCacheKey("fund", "stats", "global");

export async function GET() {
  try {
    const cached = await getCached<FundStatsResponse>(CACHE_KEY);
    if (cached) return jsonSuccess(cached);

    const collection = await getCollection<FundPledgeDocument>("fund_pledges");
    const activePledges = await collection.find({ status: "active" }).toArray();

    const activePledgers = activePledges.length;
    const monthlyPoolCents = activePledges.reduce((sum, p) => sum + p.monthlyAmountCents, 0);
    const dollars = (monthlyPoolCents / 100).toFixed(0);
    const monthlyPoolFormatted = `$${Number(dollars).toLocaleString()} / month`;

    const stats: FundStatsResponse = { activePledgers, monthlyPoolCents, monthlyPoolFormatted };

    await setCached(CACHE_KEY, stats, CacheTTL.PETITIONS);

    return jsonSuccess(stats);
  } catch (error) {
    logger.error("Failed to fetch fund stats:", error);
    return jsonError("Failed to load fund statistics.", 500);
  }
}
