import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeClient, MemberDocument, ProcessedStripeEventDocument } from "@/lib/stripe";
import { getCollection } from "@/lib/mongodb";
import { resend } from "@/config";
import { createLogger } from "@/lib/logger";

const logger = createLogger("StripeWebhook");

/** Stripe requires the raw request body for signature verification — do NOT parse with request.json() */
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.error("STRIPE_WEBHOOK_SECRET is not configured");
    return new NextResponse("Webhook secret not configured", { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return new NextResponse("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Webhook signature verification failed:", message);
    return new NextResponse(`Webhook signature invalid: ${message}`, { status: 400 });
  }

  // Idempotency guard: skip already-processed events
  try {
    const processedCollection = await getCollection<ProcessedStripeEventDocument>("stripe_processed_events");
    const alreadyProcessed = await processedCollection.findOne({ stripeEventId: event.id });
    if (alreadyProcessed) {
      logger.error(`Event ${event.id} already processed — skipping`);
      return new NextResponse("Already processed", { status: 200 });
    }
    await processedCollection.insertOne({ stripeEventId: event.id, processedAt: new Date() });
  } catch (err) {
    logger.error("Failed to check/record processed event:", err);
    // Continue processing even if idempotency check fails to avoid blocking legitimate events
  }

  try {
    await handleEvent(event);
  } catch (err) {
    logger.error(`Failed to handle event ${event.type}:`, err);
    return new NextResponse("Event handler failed", { status: 500 });
  }

  return new NextResponse("OK", { status: 200 });
}

async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    case "invoice.payment_failed":
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;
    default:
      // Unhandled event types are not errors — just no-ops
      break;
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  if (session.mode !== "subscription") return;

  const stripe = getStripeClient();
  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;

  const [subscription, customer] = await Promise.all([
    stripe.subscriptions.retrieve(subscriptionId),
    stripe.customers.retrieve(customerId),
  ]);

  if (customer.deleted) {
    logger.error("Customer was deleted:", customerId);
    return;
  }

  const plan = (subscription.metadata.plan as string) ?? "monthly";
  const clerkUserId = session.client_reference_id ?? subscription.metadata.clerkUserId ?? undefined;
  const email = (customer as Stripe.Customer).email ?? "";

  // In Stripe API clover+, billing period lives on each SubscriptionItem
  const firstItem = subscription.items.data[0];
  const currentPeriodStart = firstItem ? new Date(firstItem.current_period_start * 1000) : new Date();
  const currentPeriodEnd = firstItem ? new Date(firstItem.current_period_end * 1000) : new Date();

  const memberDoc: MemberDocument = {
    clerkUserId,
    email,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    plan: plan as "monthly" | "annual",
    status: mapSubscriptionStatus(subscription.status),
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const membersCollection = await getCollection<MemberDocument>("members");
  await membersCollection.updateOne(
    { stripeCustomerId: customerId },
    { $set: memberDoc },
    { upsert: true },
  );

  logger.error(`Member record created/updated for customer: ${customerId}`);

  if (email) {
    try {
      await resend.emails.send({
        from: "CongressDoYourJob <no-reply@congressdoyourjob.com>",
        to: email,
        subject: "Welcome to Congress Do Your Job — Membership Confirmed",
        html: membershipConfirmationEmail(email, plan),
      });
    } catch (emailErr) {
      logger.error("Failed to send membership confirmation email:", emailErr);
    }
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const firstItem = subscription.items.data[0];
  const membersCollection = await getCollection<MemberDocument>("members");
  await membersCollection.updateOne(
    { stripeSubscriptionId: subscription.id },
    {
      $set: {
        status: mapSubscriptionStatus(subscription.status),
        ...(firstItem && {
          currentPeriodStart: new Date(firstItem.current_period_start * 1000),
          currentPeriodEnd: new Date(firstItem.current_period_end * 1000),
        }),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        updatedAt: new Date(),
      },
    },
  );
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const membersCollection = await getCollection<MemberDocument>("members");
  await membersCollection.updateOne(
    { stripeSubscriptionId: subscription.id },
    { $set: { status: "canceled", cancelAtPeriodEnd: false, updatedAt: new Date() } },
  );
}

async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = invoice.parent?.subscription_details?.subscription;
  if (!subscriptionId) return;
  const membersCollection = await getCollection<MemberDocument>("members");
  await membersCollection.updateOne(
    { stripeSubscriptionId: subscriptionId as string },
    { $set: { status: "past_due", updatedAt: new Date() } },
  );
}

function mapSubscriptionStatus(status: Stripe.Subscription.Status): MemberDocument["status"] {
  switch (status) {
    case "active":
      return "active";
    case "canceled":
      return "canceled";
    case "past_due":
      return "past_due";
    case "trialing":
      return "trialing";
    default:
      return "incomplete";
  }
}

function membershipConfirmationEmail(email: string, plan: string): string {
  const planLabel = plan === "annual" ? "Annual ($70/year)" : "Monthly ($7/month)";
  return `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1e293b;">
      <h1 style="font-size: 22px; font-weight: 600; margin-bottom: 8px;">Membership Confirmed</h1>
      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
        Thank you for becoming a member of Congress Do Your Job. Your <strong>${planLabel}</strong> membership is now active.
      </p>
      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
        Your support helps us hold elected officials accountable with objective, non-partisan data — less theater, more legislation.
      </p>
      <p style="color: #94a3b8; font-size: 13px;">
        You signed up with: ${email}<br>
        Manage your membership at <a href="https://congressdoyourjob.com/membership" style="color: #d97706;">congressdoyourjob.com/membership</a>
      </p>
    </div>
  `;
}
