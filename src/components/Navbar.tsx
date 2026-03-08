import Link from "next/link";
import Image from "next/image";
import { NavAuthButton } from "./NavAuthButton";
import { freePressFont } from "@/styles/fonts";

const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

const NAV_LINKS = [
  { label: "Briefing", href: "/legislation" },
  { label: "Scorecards", href: "/scorecard" },
  { label: "Representatives", href: "/representatives" },
];

export function Navbar() {
  return (
    <nav className="sticky top-0 z-40 border-b-2 border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 shadow">
            <Image
              src="/logos/figma/figma_logo_light.svg"
              alt="Congress Do Your Job"
              width={28}
              height={28}
              unoptimized
            />
          </div>
          <span className={`${freePressFont.className} hidden text-lg font-semibold text-slate-900 sm:block`}>
            Congress Do Your Job
          </span>
        </Link>

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
      </div>
    </nav>
  );
}
