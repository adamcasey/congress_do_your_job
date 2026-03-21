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
  "/fund(.*)",
]);

const isComingSoonMode = process.env.COMING_SOON_MODE === "true";

/**
 * Redirects to /coming-soon when COMING_SOON_MODE=true env var is set.
 * Skips the redirect for /coming-soon itself and all /api/* routes.
 */
function comingSoonRedirect(req: NextRequest): NextResponse | null {
  if (!isComingSoonMode) return null;
  const { pathname } = req.nextUrl;
  if (pathname === "/coming-soon" || pathname.startsWith("/api/")) return null;
  return NextResponse.redirect(new URL("/coming-soon", req.url));
}

/**
 * When Clerk keys are present: run Clerk middleware and protect account routes.
 * When Clerk keys are absent (pre-launch / dev without keys): pass all requests through.
 * Coming-soon mode is applied before auth checks in both cases.
 */
export default process.env.CLERK_SECRET_KEY
  ? clerkMiddleware((auth, req) => {
      const redirect = comingSoonRedirect(req);
      if (redirect) return redirect;
      if (isProtectedRoute(req)) auth.protect();
    })
  : function passthrough(req: NextRequest) {
      return comingSoonRedirect(req) ?? NextResponse.next();
    };

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
