'use client'

import { useEffect, useState } from 'react'
import { freePressFont } from '@/styles/fonts'

export function BudgetCountdown() {
  const [daysSince, setDaysSince] = useState<number | null>(null)

  useEffect(() => {
    // Date should be set via NEXT_PUBLIC_LAST_BUDGET_DATE env var
    // Format: YYYY-MM-DD
    const lastBudgetDateStr = process.env.NEXT_PUBLIC_LAST_BUDGET_DATE || '1997-09-30'
    const lastBudgetDate = new Date(lastBudgetDateStr)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - lastBudgetDate.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    setDaysSince(diffDays)
  }, [])

  if (daysSince === null) {
    return null
  }

  return (
    <div className="mb-6">
      <div className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-[28px] bg-gradient-to-r from-slate-200 via-amber-100/70 to-emerald-100/60 p-[1px] shadow-lg shadow-slate-200/60">
        <div className="relative rounded-[27px] bg-white/85 px-6 py-5 backdrop-blur-sm sm:px-8">
          <div className="pointer-events-none absolute -right-16 -top-14 h-40 w-40 rounded-full bg-amber-100/60 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-16 h-40 w-40 rounded-full bg-emerald-100/50 blur-3xl" />

          <div className="relative grid items-center gap-4 text-center sm:grid-cols-[1.3fr_auto_0.7fr] lg:grid-cols-[1.35fr_auto_0.65fr]">
            <div className="hidden sm:block" />

            <div className="flex flex-wrap items-baseline justify-center gap-3">
              <span
                className={`${freePressFont.className} text-4xl font-semibold tabular-nums text-slate-900 md:text-5xl`}
              >
                {daysSince.toLocaleString()}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500">
                days since congress passed all 12 appropiations bills
              </span>
            </div>

            <div className="flex justify-center sm:justify-end">
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
    </div>
  )
}
