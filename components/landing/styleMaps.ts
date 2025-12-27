import { Metric, Status } from './types'

export const statusStyles: Record<Status, { label: string; classes: string }> = {
  advanced: { label: 'Moved', classes: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  passed: { label: 'Passed', classes: 'bg-emerald-200 text-emerald-900 border-emerald-300' },
  stalled: { label: 'Stalled', classes: 'bg-amber-100 text-amber-800 border-amber-200' },
  overdue: { label: 'Overdue', classes: 'bg-orange-100 text-orange-900 border-orange-200' },
  scheduled: { label: 'Scheduled', classes: 'bg-lime-100 text-lime-800 border-lime-200' },
  update: { label: 'Update', classes: 'bg-slate-100 text-slate-800 border-slate-200' },
}

export const scoreBands: Record<
  NonNullable<Metric['tone']>,
  { text: string; bar: string; chip: string }
> = {
  good: {
    text: 'text-emerald-700',
    bar: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600',
    chip: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
  },
  caution: {
    text: 'text-amber-700',
    bar: 'bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500',
    chip: 'bg-amber-50 text-amber-800 border border-amber-200',
  },
  neutral: {
    text: 'text-slate-700',
    bar: 'bg-gradient-to-r from-slate-300 via-slate-400 to-slate-500',
    chip: 'bg-slate-50 text-slate-800 border border-slate-200',
  },
}
