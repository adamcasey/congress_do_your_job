'use client'

import { useEffect, useState } from 'react'

export function BudgetCountdown() {
  const [daysSince, setDaysSince] = useState<number | null>(null)

  useEffect(() => {
    // Date should be set via NEXT_PUBLIC_LAST_BUDGET_DATE env var
    // Format: YYYY-MM-DD
    const lastBudgetDateStr = process.env.NEXT_PUBLIC_LAST_BUDGET_DATE || '2015-05-05'
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
    <div className="w-full border-b border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-red-50">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center gap-2 text-center sm:flex-row sm:gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold tabular-nums text-amber-900 sm:text-5xl">
              {daysSince.toLocaleString()}
            </span>
            <span className="text-lg font-medium text-amber-800 sm:text-xl">
              days
            </span>
          </div>
          <span className="text-sm font-medium text-amber-700 sm:text-base">
            since a budget resolution was passed
          </span>
        </div>
      </div>
    </div>
  )
}
