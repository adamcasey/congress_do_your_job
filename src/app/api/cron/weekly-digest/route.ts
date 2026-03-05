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
    });

    // --- Fetch subscriber list ---
    const waitlistCollection = await getCollection<WaitlistSignup>("waitlist");
    const subscribers = await waitlistCollection.find({ confirmed: true }).toArray();
    stats.subscribersTotal = subscribers.length;

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
        await resend.emails.send({
          from: "CongressDoYourJob <no-reply@congressdoyourjob.com>",
          to: subscriber.email,
          subject,
          html: emailHtml,
        });
        stats.emailsSent++;
      } catch (err) {
        logger.error(`Failed to send digest to ${subscriber.email}:`, err);
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
    logger.error("Weekly digest cron error:", error);
    return jsonError("Failed to send weekly digest", 500, { stats });
  }
}
