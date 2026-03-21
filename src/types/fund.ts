import type { FundTierKey } from "@/lib/stripe";

export type { FundTierKey };

export type FundPledgeStatus = "active" | "canceled" | "past_due" | "trialing" | "incomplete";

export interface FundStatsResponse {
  activePledgers: number;
  monthlyPoolCents: number;
  /** Human-readable pool total, e.g. "$420 / month" */
  monthlyPoolFormatted: string;
}
