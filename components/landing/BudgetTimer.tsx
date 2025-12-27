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

  return (
    <div className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 ring-1 ring-amber-100 shadow-sm">
      <span className="h-2 w-2 rounded-full bg-orange-500" aria-hidden />
      <span className="text-slate-500">Full budget passed</span>
      <span className="font-bold text-slate-900">
        {elapsed.days}d {elapsed.hours}:{elapsed.minutes}:{elapsed.seconds}
      </span>
      <span className="text-slate-500">ago (not a CR)</span>
    </div>
  )
}
