import { NextRequest } from "next/server";
import Stripe from "stripe";
import { getStripeClient, FUND_TIERS, FUND_PLEDGE_TYPE, type FundTierKey } from "@/lib/stripe";
import { getAuthSession, getAuthUser } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { jsonError, jsonSuccess } from "@/lib/api-response";

const logger = createLogger("FundPledgeAPI");

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://congressdoyourjob.com";

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripeClient();

    const body = (await request.json()) as { tier?: string };
    const tier = body.tier as FundTierKey | undefined;

    if (!tier || !(tier in FUND_TIERS)) {
      return jsonError("Invalid tier. Must be 'starter', 'advocate', or 'champion'.", 400);
    }

    const selectedTier = FUND_TIERS[tier];
    const priceId = selectedTier.priceId();

    if (!priceId) {
      logger.error(`Stripe price ID not configured for fund tier: ${tier}`);
      return jsonError("This pledge tier is not yet available. Please check back soon.", 503);
    }

    const { userId } = await getAuthSession();
    const user = await getAuthUser();

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_URL}/fund/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/fund`,
      allow_promotion_codes: false,
      billing_address_collection: "required",
      subscription_data: {
        metadata: {
          type: FUND_PLEDGE_TYPE,
          tier,
          ...(userId ? { clerkUserId: userId } : {}),
        },
      },
    };

    if (user?.emailAddresses?.[0]?.emailAddress) {
      sessionParams.customer_email = user.emailAddresses[0].emailAddress;
    }

    if (userId) {
      sessionParams.client_reference_id = userId;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return jsonSuccess({ url: session.url });
  } catch (error) {
    logger.error("Fund pledge checkout session creation failed:", error);

    if (error instanceof Error && error.message.includes("STRIPE_SECRET_KEY")) {
      return jsonError("Payment service not configured.", 503);
    }

    return jsonError("Failed to create checkout session. Please try again.", 500);
  }
}
