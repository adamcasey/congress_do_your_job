"use client"

import { useEffect, useMemo, useState } from 'react'
import { LAST_FULL_BUDGET_PASSED_AT } from './data'

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

export function BudgetBanner() {
  const start = useMemo(() => new Date(LAST_FULL_BUDGET_PASSED_AT).getTime(), [])
  const [elapsed, setElapsed] = useState(() => formatDuration(Date.now() - start))
  const invalidDate = Number.isNaN(start)

  useEffect(() => {
    if (invalidDate) return
    // Align client hydration with server render by delaying the first tick
    const id = setInterval(() => setElapsed(formatDuration(Date.now() - start)), 1000)
    return () => clearInterval(id)
  }, [start, invalidDate])

  // Ensure server and client render the same initial value
  const renderElapsed = useMemo(() => formatDuration(start ? Date.now() - start : 0), [start])

  useEffect(() => {
    if (invalidDate) return
    const tick = () => setElapsed(formatDuration(Date.now() - start))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [start, invalidDate])

  return (
    <div className="relative isolate overflow-hidden rounded-3xl border border-amber-100 bg-gradient-to-r from-amber-50 via-white to-emerald-50 px-5 py-4 shadow-lg shadow-amber-100/50">
      <div className="pointer-events-none absolute inset-0 bg-dot-grid bg-[size:20px_20px] opacity-40" />
      <div className="relative flex flex-wrap items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-sm font-bold text-amber-600 ring-1 ring-amber-100 shadow-sm">
          ⏱
        </span>
        <div className="flex flex-col leading-tight text-slate-900">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
            Days since Congress passed a full budget (not a CR)
          </span>
          {invalidDate ? (
            <span className="text-lg font-semibold">Waiting for latest budget date…</span>
          ) : (
            <span className="text-2xl font-bold">
          {elapsed.days ?? renderElapsed.days}d {elapsed.hours ?? renderElapsed.hours}:
          {elapsed.minutes ?? renderElapsed.minutes}:{elapsed.seconds ?? renderElapsed.seconds}
            </span>
          )}
        </div>
        <div className="ml-auto flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
          <span className="rounded-full bg-white px-3 py-1 ring-1 ring-amber-100">Not a continuing resolution</span>
          <span className="rounded-full bg-white px-3 py-1 ring-1 ring-amber-100">Updates every second</span>
        </div>
      </div>
    </div>
  )
}
