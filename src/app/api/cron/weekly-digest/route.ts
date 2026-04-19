import { NextRequest } from "next/server";
import { getCollection } from "@/lib/mongodb";
import { resend } from "@/config";
import { generateWeeklyDigest, markDigestPublished } from "@/services/digest-generator";
import { WeeklyDigest } from "@/emails/templates/WeeklyDigest";
import { WaitlistSignup } from "@/types/waitlist";
import { createLogger } from "@/lib/logger";
import { jsonError, jsonSuccess } from "@/lib/api-response";

const logger = createLogger("WeeklyDigestCron");

export async function GET(request: NextRequest) {
  logger.info("Weekly digest cron started", {
    userAgent: request.headers.get("user-agent"),
    timestamp: new Date().toISOString(),
  });

  const stats = {
    editionNumber: 0,
    subscribersTotal: 0,
    emailsSent: 0,
    emailsFailed: 0,
  };

  try {
    // --- Generate (or retrieve idempotently) the digest ---
    const digest = await generateWeeklyDigest();
    stats.editionNumber = digest.editionNumber;

    logger.info("Digest ready", {
      editionNumber: digest.editionNumber,
      featuredBills: digest.featuredBills.length,
      alreadyPublished: digest.alreadyPublished,
    });

    // Guard: if this edition was already published in a prior run, do not re-send.
    // Without this, every subsequent cron invocation (or manual trigger) would
    // blast all subscribers with the same digest again.
    if (digest.alreadyPublished) {
      logger.info("Digest already published this week — no emails sent", {
        editionNumber: digest.editionNumber,
      });
      return jsonSuccess({ message: "Digest already published this week", stats });
    }

    // --- Fetch subscriber list ---
    const waitlistCollection = await getCollection<WaitlistSignup>("waitlist");
    const subscribers = await waitlistCollection.find({ confirmed: true }).toArray();
    stats.subscribersTotal = subscribers.length;

    logger.info("Subscriber list fetched", { total: subscribers.length });

    if (subscribers.length === 0) {
      logger.info("No confirmed subscribers — marking draft published without sending");
      await markDigestPublished(digest.editionId);
      return jsonSuccess({ message: "No subscribers to email", stats });
    }

    // --- Render email HTML once (same content for all subscribers) ---
    const weekOf = digest.weekStart.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });

    const emailHtml = WeeklyDigest({
      editionNumber: digest.editionNumber,
      weekOf,
      headline: digest.headline,
      overallSummary: digest.overallSummary,
      stats: digest.stats,
      featuredBills: digest.featuredBills,
    });

    const subject = `${digest.headline} — Edition #${digest.editionNumber}`;

    // --- Send to each subscriber ---
    // For scale beyond a few hundred subscribers, replace with Resend Broadcast API
    // or Resend batch send (max 100/batch). For MVP waitlist sizes this loop is fine.
    for (const subscriber of subscribers) {
      try {
        const { data, error } = await resend.emails.send({
          from: "CongressDoYourJob <no-reply@congressdoyourjob.com>",
          to: subscriber.email,
          subject,
          html: emailHtml,
        });

        if (error) {
          logger.error(`Resend rejected email to ${subscriber.email}`, {
            name: error.name,
            message: error.message,
          });
          stats.emailsFailed++;
        } else {
          logger.info(`Email sent to ${subscriber.email}`, { resendId: data?.id });
          stats.emailsSent++;
        }
      } catch (err) {
        const resendErr = err as { name?: string; message?: string; statusCode?: number };
        logger.error(`Failed to send digest to ${subscriber.email}`, {
          name: resendErr.name,
          message: resendErr.message,
          statusCode: resendErr.statusCode,
        });
        stats.emailsFailed++;
      }
    }

    // --- Mark published ---
    await markDigestPublished(digest.editionId);

    logger.info("Weekly digest cron complete", stats);

    return jsonSuccess({
      message: "Weekly digest sent",
      stats,
    });
  } catch (error) {
    const resendErr = error as { name?: string; message?: string; statusCode?: number };
    logger.error("Weekly digest cron error", {
      name: resendErr.name ?? (error instanceof Error ? error.constructor.name : "Unknown"),
      message: resendErr.message ?? String(error),
      statusCode: resendErr.statusCode,
    });
    return jsonError("Failed to send weekly digest", 500, { stats });
  }
}
