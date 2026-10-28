import { NextRequest } from "next/server";
import { getCollection } from "@/lib/mongodb";
import { WaitlistSignup } from "@/types/waitlist";
import { resend } from "@/config";
import { WaitlistConfirmation } from "@/emails";
import { createLogger } from "@/lib/logger";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { getRedisClient } from "@/config";

const logger = createLogger("WaitlistAPI");

// shortcut: fixed-window rate limit (10 req/IP/min); upgrade to @upstash/ratelimit for sliding window
async function isRateLimited(ip: string): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;
  const key = `rate:waitlist:${ip}:${Math.floor(Date.now() / 60000)}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 60);
  return count > 10;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (await isRateLimited(ip)) {
    return jsonError("Too many requests. Please try again later.", 429);
  }
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return jsonError("Email is required", 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return jsonError("Please enter a valid email address", 400);
    }

    const waitlistCollection = await getCollection<WaitlistSignup>("waitlist");

    const existingSignup = await waitlistCollection.findOne({ email });
    if (existingSignup) {
      return jsonError("This email is already on the waitlist", 409);
    }

    const signup: WaitlistSignup = {
      email,
      signedUpAt: new Date(),
      confirmed: true,
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    };

    await waitlistCollection.insertOne(signup);

    try {
      await resend.emails.send({
        from: "CongressDoYourJob <no-reply@congressdoyourjob.com>",
        to: email,
        subject: "You're on the list — Congress Do Your Job",
        html: WaitlistConfirmation({ email }),
      });
    } catch (emailError) {
      logger.error("Failed to send confirmation email:", emailError);
    }

    return jsonSuccess({ message: "Successfully added to waitlist" }, { status: 201 });
  } catch (error) {
    logger.error("Waitlist signup error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isDatabaseError = errorMessage.includes("Mongo") || errorMessage.includes("connect");

    if (isDatabaseError) {
      return jsonError("Database connection error. Please try again later.", 503);
    }

    return jsonError("Failed to sign up for waitlist. Please try again.", 500);
  }
}
