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
    <nav className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 shadow-sm">
            <Image
              src="/logos/figma/figma_logo_light.svg"
              alt="Congress Do Your Job"
              width={20}
              height={20}
              unoptimized
            />
          </div>
          <span className={`${freePressFont.className} hidden text-base text-slate-900 sm:block`}>
            Congress Do Your Job
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="shrink-0">{hasClerk && <NavAuthButton />}</div>
      </div>
    </nav>
  );
}
