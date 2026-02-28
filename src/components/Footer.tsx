import Link from "next/link";
import Image from "next/image";
import { freePressFont, latoFont } from "@/styles/fonts";
const figmaLogoLight = "/logos/figma/figma_logo_light.svg";

const navGroups = [
  {
    title: "Explore",
    links: [
      { label: "Home", href: "/" },
      { label: "About", href: "/about" },
      { label: "Find representatives", href: "/representatives" },
      { label: "Weekly briefing", href: "/coming-soon" },
    ],
  },
  {
    title: "Get involved",
    links: [
      { label: "Share feedback", href: "mailto:hello@congressdoyourjob.com", external: true },
      { label: "Join the waitlist", href: "/coming-soon" },
      { label: "Press + partnerships", href: "mailto:press@congressdoyourjob.com", external: true },
    ],
  },
];

export default function Footer() {
  return (
    <footer
      className={`relative overflow-hidden border-t border-amber-200/60 bg-gradient-to-br from-slate-50 via-white to-amber-50/30 ${latoFont.className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(148,163,184,0.25)_1px,transparent_1px)] bg-[size:20px_20px] opacity-30" />
      <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-amber-100/50 blur-3xl" />
      <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-emerald-100/40 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-12 md:grid-cols-[1.3fr_1fr]">
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-[11px] font-semibold uppercase tracking-[0.3em] text-white shadow-lg shadow-slate-900/30">
                <Image src={figmaLogoLight} alt={"Congress Do Your Job Logo"} width={64} height={64} unoptimized />
              </div>
              <div>
                <p className={`${freePressFont.className} text-2xl text-slate-900`}>Congress Do Your Job</p>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Less theater. More legislation.
                </p>
              </div>
            </div>
            <p className="max-w-xl text-sm text-slate-600">
              A calm, plain-English dashboard for what Congress actually did this week. Nonpartisan, source-linked, and designed
              for busy people.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/coming-soon"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white shadow-sm shadow-slate-900/30 transition hover:-translate-y-[1px] hover:shadow-md"
              >
                Join the weekly briefing
                <span aria-hidden>&rarr;</span>
              </Link>
              <Link
                href="/representatives"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-700 shadow-sm transition hover:-translate-y-[1px] hover:border-amber-300"
              >
                Find your reps
              </Link>
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-2">
            {navGroups.map((group) => (
              <div key={group.title} className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{group.title}</p>
                <ul className="space-y-2 text-sm text-slate-700">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      {link.external ? (
                        <a className="transition hover:text-slate-900" href={link.href}>
                          {link.label}
                        </a>
                      ) : (
                        <Link className="transition hover:text-slate-900" href={link.href}>
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 border-t border-slate-200/70 pt-6">
          <div className="flex flex-col gap-4 text-xs text-slate-500">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Link href="/privacy" className="transition hover:text-slate-700 hover:underline">
                Privacy Policy
              </Link>
              <Link href="/terms" className="transition hover:text-slate-700 hover:underline">
                Terms of Use
              </Link>
              <Link href="/cookies" className="transition hover:text-slate-700 hover:underline">
                Cookie Policy
              </Link>
              <Link href="/accessibility" className="transition hover:text-slate-700 hover:underline">
                Accessibility
              </Link>
              <a className="transition hover:text-slate-700 hover:underline" href="mailto:hello@congressdoyourjob.com">
                Contact
              </a>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <p>Copyright 2026 Congress Do Your Job. All rights reserved.</p>
              <p>Built with public data sources.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
