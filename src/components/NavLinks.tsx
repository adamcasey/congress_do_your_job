"use client";

import Link from "next/link";
import { NavAuthButton } from "./NavAuthButton";

const NAV_LINKS = [
  { label: "Legislation", href: "/legislation" },
  { label: "Scorecards", href: "/scorecard" },
  { label: "Petitions", href: "/petitions" },
  { label: "Fund", href: "/fund" },
  { label: "Representatives", href: "/representatives" },
];

const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

// Show nav by default; set NEXT_PUBLIC_SHOW_HEADER_NAVIGATION=false to hide.
const showNav = process.env.NEXT_PUBLIC_SHOW_HEADER_NAVIGATION !== "false";

/**
 * Renders nav links gated on the NEXT_PUBLIC_SHOW_HEADER_NAVIGATION env var.
 * Returns null when disabled, showing only the brand logo in the header.
 */
export function NavLinks() {
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
