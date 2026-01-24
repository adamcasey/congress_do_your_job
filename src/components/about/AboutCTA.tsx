"use client"

import Link from 'next/link'

export function AboutCTA() {
  return (
    <section className="mt-12 rounded-[32px] border border-slate-200/70 bg-white/90 p-6 text-center shadow-lg shadow-slate-200/50 md:flex md:items-center md:justify-between md:text-left">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Get started</p>
        <p className="mt-2 text-sm text-slate-600">
          Find your representatives or join the weekly briefing for calm, actionable updates.
        </p>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-3 md:mt-0 md:justify-end">
        <Link
          href="/representatives"
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white shadow-sm shadow-slate-900/30 transition hover:-translate-y-[1px] hover:shadow-md"
        >
          Find your reps
          <span aria-hidden>&rarr;</span>
        </Link>
        <Link
          href="/coming-soon"
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-700 shadow-sm transition hover:-translate-y-[1px] hover:border-amber-300"
        >
          Join the briefing
        </Link>
      </div>
    </section>
  )
}
