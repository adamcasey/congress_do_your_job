"use client";

import { ClerkProvider as BaseClerkProvider } from "@clerk/nextjs";
import { ReactNode } from "react";

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

/**
 * Wraps children with ClerkProvider only when NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
 * is configured. Falls back to a plain wrapper so the app remains functional
 * without Clerk keys (development / pre-launch).
 */
export function ClerkProvider({ children }: { children: ReactNode }) {
  if (!publishableKey) return <>{children}</>;
  return (
    <BaseClerkProvider publishableKey={publishableKey} afterSignOutUrl="/">
      {children}
    </BaseClerkProvider>
  );
}
