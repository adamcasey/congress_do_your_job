import { NextRequest } from "next/server";
import { getCollection } from "@/lib/mongodb";
import { resend } from "@/config";
import { generateWeeklyDigest, markDigestPublished } from "@/services/digest-generator";
import { WeeklyDigest } from "@/emails/templates/WeeklyDigest";
import { WaitlistSignup } from "@/types/waitlist";
import { createLogger } from "@/lib/logger";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { verifyCronSecret } from "@/lib/cron-auth";

const logger = createLogger("WeeklyDigestCron");

export async function GET(request: NextRequest) {
  const unauthorized = verifyCronSecret(request);
  if (unauthorized) return unauthorized;

  const testEmail = request.nextUrl.searchParams.get("test_email")?.trim() || null;
  const isTestMode = !!testEmail;

  logger.info("Weekly digest cron started", {
    userAgent: request.headers.get("user-agent"),
    timestamp: new Date().toISOString(),
    testMode: isTestMode,
    ...(isTestMode && { testEmail }),
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
    // Skip this guard in test mode so you can re-trigger without resetting DB state.
    if (digest.alreadyPublished && !isTestMode) {
      logger.info("Digest already published this week — no emails sent", {
        editionNumber: digest.editionNumber,
      });
      return jsonSuccess({ message: "Digest already published this week", stats });
    }

    // --- Resolve subscriber list ---
    // In test mode: send only to the provided address without touching the waitlist.
    let subscribers: { email: string }[];
    if (isTestMode) {
      subscribers = [{ email: testEmail! }];
    } else {
      const waitlistCollection = await getCollection<WaitlistSignup>("waitlist");
      subscribers = await waitlistCollection.find({ confirmed: true }).toArray();
    }
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

    // --- Mark published (skip in test mode to preserve idempotency state) ---
    if (!isTestMode) {
      await markDigestPublished(digest.editionId);
    }

    logger.info("Weekly digest cron complete", { ...stats, testMode: isTestMode });

    return jsonSuccess({
      message: isTestMode ? `Test digest sent to ${testEmail}` : "Weekly digest sent",
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
