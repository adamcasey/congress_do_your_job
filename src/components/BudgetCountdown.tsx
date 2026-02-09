'use client'

import { freePressFont } from '@/styles/fonts'

export function BudgetCountdown() {
  const daysSince = (() => {
    // Date should be set via NEXT_PUBLIC_LAST_BUDGET_DATE env var
    // Format: YYYY-MM-DD
    const lastBudgetDateStr = process.env.NEXT_PUBLIC_LAST_BUDGET_DATE || '1997-09-30'
    const lastBudgetDate = new Date(lastBudgetDateStr)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - lastBudgetDate.getTime())
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  })()

  return (
    <div className="mb-6">
      <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[28px] bg-gradient-to-r from-slate-200 via-amber-100/70 to-emerald-100/60 p-[1px] shadow-lg shadow-slate-200/60">
        <div className="relative rounded-[27px] bg-white/85 px-6 py-5 backdrop-blur-sm sm:px-8">
          <div className="pointer-events-none absolute -right-16 -top-14 h-40 w-40 rounded-full bg-amber-100/60 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-16 h-40 w-40 rounded-full bg-emerald-100/50 blur-3xl" />

          <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center gap-2 text-center sm:grid sm:grid-cols-[auto_1fr_auto] sm:items-center sm:text-left sm:gap-2">
            <span
              className={`${freePressFont.className} text-4xl font-semibold tabular-nums text-slate-900 md:text-5xl`}
            >
              {daysSince.toLocaleString()}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500 sm:text-center">
              days since congress passed all 12 appropiations bills
            </span>
            <a
              href="https://www.pewresearch.org/short-reads/2025/10/01/congress-has-long-struggled-to-pass-spending-bills-on-time/#:~:text=In%20fact%2C%20in%20the%20nearly,%2C%201989%2C%201995%20and%201997."
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-2xl bg-slate-900 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white shadow-md shadow-slate-900/30 transition hover:-translate-y-[1px] hover:bg-slate-800"
              target="_blank"
              rel="noreferrer"
            >
              what&apos;s this?
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
