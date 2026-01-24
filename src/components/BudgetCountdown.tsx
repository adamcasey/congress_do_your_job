'use client'

import { useEffect, useState } from 'react'

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
    <div className="mb-4 rounded-2xl border border-amber-100/60 bg-white/40 px-6 py-3 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-center gap-2 text-center">
        <span className="text-3xl font-bold tabular-nums text-amber-900">
          {daysSince.toLocaleString()}
        </span>
        <span className="text-base font-medium text-amber-700">
          days since a budget resolution was passed
        </span>
      </div>
    </div>
  )
}
