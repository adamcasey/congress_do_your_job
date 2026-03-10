"use client";

import Link from "next/link";
import { NavAuthButton } from "./NavAuthButton";
import { useFeatureFlag } from "@/config/launchdarkly";
import { FeatureFlag } from "@/lib/feature-flags";

const NAV_LINKS = [
  { label: "Briefing", href: "/legislation" },
  { label: "Scorecards", href: "/scorecard" },
  { label: "Representatives", href: "/representatives" },
];

const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/**
 * Client component that renders nav links gated on the show-header-nagivation flag.
 * Returns null when the flag is disabled, showing only the brand logo in the header.
 */
export function NavLinks() {
  const showNav = useFeatureFlag(FeatureFlag.SHOW_HEADER_NAVIGATION);

  if (!showNav) return null;

  return (
    <div className="flex items-center gap-1">
      {NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
        >
          {link.label}
        </Link>
      ))}
      {hasClerk && <NavAuthButton />}
    </div>
  );
}
