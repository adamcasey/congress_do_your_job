import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/account(.*)",
  "/settings(.*)",
  "/petitions/sign(.*)",
  "/legislation(.*)",
  "/scorecard(.*)",
  "/petitions(.*)",
]);

/**
 * When Clerk keys are present: run Clerk middleware and protect account routes.
 * When Clerk keys are absent (pre-launch / dev without keys): pass all requests through.
 */
export default process.env.CLERK_SECRET_KEY
  ? clerkMiddleware((auth, req) => {
      if (isProtectedRoute(req)) auth.protect();
    })
  : function passthrough(_req: NextRequest) {
      return NextResponse.next();
    };

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
