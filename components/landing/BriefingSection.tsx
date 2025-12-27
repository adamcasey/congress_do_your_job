import { StatusBadge } from './StatusBadge'
import { SectionHeader } from './SectionHeader'
import { BriefingItem } from './types'

export function BriefingSection({
  items,
  deadlines,
}: {
  items: BriefingItem[]
  deadlines: BriefingItem[]
}) {
  return (
    <section className="grid gap-6 rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-lg shadow-slate-200/60">
      <SectionHeader
        eyebrow="Briefing"
        title="This week in Congress"
        description="A neutral, Strava-style activity view meets Tangle-style clarity. Every item links to primary sources in production."
      />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          {items.map((item) => (
            <article
              key={item.title}
              className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm transition hover:-translate-y-[2px] hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <StatusBadge status={item.status} />
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Primary source</span>
              </div>
              <h3 className="mt-3 text-xl font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.summary}</p>
              <p className="mt-2 text-sm font-medium text-slate-800">{item.detail}</p>
            </article>
          ))}
        </div>
        <div className="space-y-4 rounded-2xl border border-amber-100 bg-amber-50/70 p-5 shadow-inner">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Deadlines and what slipped</h3>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 ring-1 ring-amber-100">
              Schedule
            </span>
          </div>
          {deadlines.map((item) => (
            <article key={item.title} className="rounded-xl border border-amber-100 bg-white/90 px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-base font-semibold text-slate-900">{item.title}</h4>
                <StatusBadge status={item.status} />
              </div>
              <p className="mt-1 text-sm text-slate-700">{item.summary}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{item.detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
