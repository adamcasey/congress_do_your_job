import { NextRequest } from "next/server";
import { jsonError } from "@/lib/api-response";
import { NextResponse } from "next/server";

/**
 * Validates that the request carries the Vercel cron secret.
 *
 * Vercel automatically sets CRON_SECRET and sends it as
 * `Authorization: Bearer <secret>` on every cron invocation.
 * External requests (e.g. manual curl) must include the same header.
 *
 * Returns a 401 response if validation fails, or null if the request is valid.
 * Usage:
 *   const unauthorized = verifyCronSecret(request);
 *   if (unauthorized) return unauthorized;
 */
export function verifyCronSecret(request: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;

  // If the secret is not configured, skip validation in local dev.
  // In production, Vercel always sets CRON_SECRET.
  if (!secret) return null;

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return jsonError("Unauthorized", 401) as NextResponse;
  }

  return null;
}
