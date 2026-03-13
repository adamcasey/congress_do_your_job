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

export interface ProcessedStripeEventDocument extends Document {
  stripeEventId: string;
  processedAt: Date;
}
