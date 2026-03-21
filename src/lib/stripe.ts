import Stripe from "stripe";
import { Document } from "mongodb";

export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(secretKey, { apiVersion: "2026-02-25.clover" });
}

export const PLANS = {
  monthly: {
    priceId: (): string => process.env.STRIPE_MONTHLY_PRICE_ID ?? "",
    name: "Monthly Member",
    amount: 700,
    interval: "month" as const,
    label: "$7 / month",
    annualEquivalent: "$84 / year",
  },
  annual: {
    priceId: (): string => process.env.STRIPE_ANNUAL_PRICE_ID ?? "",
    name: "Annual Member",
    amount: 7000,
    interval: "year" as const,
    label: "$70 / year",
    annualEquivalent: "Save ~$14 vs. monthly",
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export const FUND_TIERS = {
  starter: {
    priceId: (): string => process.env.STRIPE_FUND_STARTER_PRICE_ID ?? "",
    name: "Starter",
    amount: 500,
    label: "$5 / month",
    description: "A small but meaningful pledge.",
  },
  advocate: {
    priceId: (): string => process.env.STRIPE_FUND_ADVOCATE_PRICE_ID ?? "",
    name: "Advocate",
    amount: 1000,
    label: "$10 / month",
    description: "Double the impact.",
  },
  champion: {
    priceId: (): string => process.env.STRIPE_FUND_CHAMPION_PRICE_ID ?? "",
    name: "Champion",
    amount: 2000,
    label: "$20 / month",
    description: "Lead by example.",
  },
} as const;

export type FundTierKey = keyof typeof FUND_TIERS;

/** Metadata key used to distinguish fund pledge subscriptions from membership subscriptions */
export const FUND_PLEDGE_TYPE = "fund_pledge";

export interface MemberDocument extends Document {
  clerkUserId?: string;
  email: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  plan: PlanKey;
  status: "active" | "canceled" | "past_due" | "trialing" | "incomplete";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FundPledgeDocument extends Document {
  clerkUserId?: string;
  email: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  tier: FundTierKey;
  monthlyAmountCents: number;
  status: "active" | "canceled" | "past_due" | "trialing" | "incomplete";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcessedStripeEventDocument extends Document {
  stripeEventId: string;
  processedAt: Date;
}
