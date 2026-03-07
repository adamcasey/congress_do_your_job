"use client";

import { SignInButton, UserButton, Show } from "@clerk/nextjs";

/**
 * Shows a Sign In button for unauthenticated users and a Clerk UserButton
 * for authenticated users. Must only be rendered inside ClerkProvider.
 *
 * Uses Clerk v7's Show component (replaces the removed SignedIn/SignedOut).
 */
export function NavAuthButton() {
  return (
    <Show
      when="signed-in"
      fallback={
        <SignInButton mode="modal">
          <button className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 shadow-sm transition hover:-translate-y-[1px] hover:border-amber-300 hover:shadow">
            Sign in
          </button>
        </SignInButton>
      }
    >
      <UserButton
        appearance={{
          elements: {
            avatarBox: "h-8 w-8",
          },
        }}
      />
    </Show>
  );
}
