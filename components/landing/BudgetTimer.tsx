"use client"

import { useEffect, useMemo, useState } from 'react'

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return {
    days,
    hours: hours.toString().padStart(2, '0'),
    minutes: minutes.toString().padStart(2, '0'),
    seconds: seconds.toString().padStart(2, '0'),
  }
}

export function BudgetTimer({ lastBudgetDateIso }: { lastBudgetDateIso: string }) {
  const start = useMemo(() => new Date(lastBudgetDateIso).getTime(), [lastBudgetDateIso])
  const [elapsed, setElapsed] = useState(() => formatDuration(Date.now() - start))

  useEffect(() => {
    const tick = () => setElapsed(formatDuration(Date.now() - start))
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [start])

  const invalidDate = Number.isNaN(start)

  if (invalidDate) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-5 py-3 text-sm font-semibold text-slate-800 ring-1 ring-amber-100 shadow-sm">
        <span className="h-2.5 w-2.5 rounded-full bg-orange-500" aria-hidden />
        <span>Waiting for latest budget date…</span>
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-3 rounded-full bg-white/90 px-5 py-3 text-sm font-semibold text-slate-900 ring-1 ring-amber-100 shadow-sm shadow-amber-100/50">
      <span className="h-2.5 w-2.5 rounded-full bg-orange-500" aria-hidden />
      <div className="flex flex-col leading-tight">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Days since a full budget (not a CR)
        </span>
        <span className="text-lg font-bold">
          {elapsed.days}d {elapsed.hours}:{elapsed.minutes}:{elapsed.seconds}
        </span>
      </div>
    </div>
  )
}
