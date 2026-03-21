import { NextRequest } from "next/server";
import { resend } from "@/config";
import { WaitlistConfirmation } from "@/emails";
import { createLogger } from "@/lib/logger";
import { jsonError, jsonSuccess } from "@/lib/api-response";

const logger = createLogger("TestEmail");

/**
 * Test endpoint for email templates
 * Only works in development environment
 *
 * Usage: POST /api/test/email with { "to": "your@email.com" }
 */

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return jsonError("Test endpoint not available in production", 403);
  }

  try {
    const body = await request.json();
    const { to } = body;

    if (!to) {
      return jsonError('Email address required. Send { "to": "your@email.com" }', 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return jsonError("Invalid email address", 400);
    }

    logger.info("Sending to:", to);

    const result = await resend.emails.send({
      from: "CongressDoYourJob <no-reply@congressdoyourjob.com>",
      to,
      subject: "[TEST] You're on the list — Congress Do Your Job",
      html: WaitlistConfirmation({ email: to }),
    });

    logger.info("Sent successfully:", result);

    return jsonSuccess({
      message: "Test email sent successfully",
      emailId: result.data?.id,
      to,
    });
  } catch (error) {
    logger.error("Error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return jsonError("Failed to send test email", 500, errorMessage);
  }
}
