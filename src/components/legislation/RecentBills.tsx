'use client'

import { useRecentLegislation } from '@/hooks/useRecentLegislation'
import { Bill } from '@/types/congress'
import { formatDate } from '@/utils/dates'

interface RecentBillsProps {
  limit?: number
  days?: number
}

export function RecentBills({ limit = 10, days = 7 }: RecentBillsProps) {
  const { data, loading, error } = useRecentLegislation({ limit, days })

  const getBillStatus = (bill: Bill): { label: string; classes: string } => {
    if (!bill.latestAction) {
      return { label: 'Unknown', classes: 'bg-slate-100 text-slate-800 border-slate-200' }
    }

    const actionText = bill.latestAction.text.toLowerCase()

    if (actionText.includes('became public law') || actionText.includes('signed by president')) {
      return { label: 'Passed', classes: 'bg-emerald-200 text-emerald-900 border-emerald-300' }
    }

    if (actionText.includes('passed') || actionText.includes('agreed to')) {
      return { label: 'Moved', classes: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
    }

    if (actionText.includes('placed on') || actionText.includes('calendar')) {
      return { label: 'Scheduled', classes: 'bg-lime-100 text-lime-800 border-lime-200' }
    }

    if (actionText.includes('referred to')) {
      return { label: 'In Committee', classes: 'bg-slate-100 text-slate-800 border-slate-200' }
    }

    return { label: 'Update', classes: 'bg-slate-100 text-slate-800 border-slate-200' }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg border border-slate-200 bg-white p-4">
            <div className="h-4 w-3/4 rounded bg-slate-200"></div>
            <div className="mt-2 h-3 w-1/2 rounded bg-slate-100"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Unable to load recent bills. {error}
      </div>
    )
  }

  if (!data || data.bills.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        No recent legislative activity found.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {data.bills.map((bill) => {
        const status = getBillStatus(bill)

        return (
          <div
            key={`${bill.congress}-${bill.type}-${bill.number}`}
            className="group rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">
                    {bill.type} {bill.number}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${status.classes}`}
                  >
                    {status.label}
                  </span>
                </div>
                <h3 className="mt-1 text-sm font-semibold leading-snug text-slate-900">
                  {bill.title}
                </h3>
                {bill.latestAction && (
                  <p className="mt-2 text-xs text-slate-600">
                    <span className="font-medium">Latest: </span>
                    {bill.latestAction.text}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  Updated {formatDate(bill.updateDate)}
                </p>
              </div>
            </div>
          </div>
        )
      })}

      {data.count > data.bills.length && (
        <p className="pt-2 text-center text-xs text-slate-500">
          Showing {data.bills.length} of {data.count} bills
        </p>
      )}
    </div>
  )
}
