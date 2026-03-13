import { NextRequest } from "next/server";
import { getStripeClient, MemberDocument } from "@/lib/stripe";
import { getAuthSession } from "@/lib/auth";
import { getCollection } from "@/lib/mongodb";
import { createLogger } from "@/lib/logger";
import { jsonError, jsonSuccess } from "@/lib/api-response";

const logger = createLogger("BillingPortalAPI");

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://congressdoyourjob.com";

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripeClient();

    const { userId } = await getAuthSession();
    if (!userId) {
      return jsonError("Authentication required", 401);
    }

    const body = (await request.json().catch(() => ({}))) as { stripeCustomerId?: string };
    let stripeCustomerId = body.stripeCustomerId;

    if (!stripeCustomerId) {
      const membersCollection = await getCollection<MemberDocument>("members");
      const member = await membersCollection.findOne({ clerkUserId: userId });
      stripeCustomerId = member?.stripeCustomerId;
    }

    if (!stripeCustomerId) {
      return jsonError("No active membership found for this account.", 404);
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${APP_URL}/membership`,
    });

    return jsonSuccess({ url: portalSession.url });
  } catch (error) {
    logger.error("Billing portal session creation failed:", error);

    if (error instanceof Error && error.message.includes("STRIPE_SECRET_KEY")) {
      return jsonError("Payment service not configured.", 503);
    }

    return jsonError("Failed to open billing portal. Please try again.", 500);
  }
}
