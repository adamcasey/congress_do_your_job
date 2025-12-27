import { SectionHeader } from './SectionHeader'
import { scoreBands } from './styleMaps'
import { Metric } from './types'

export function ProductivitySection({ metrics }: { metrics: Metric[] }) {
  return (
    <section className="grid gap-6 rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-lg shadow-slate-200/60">
      <SectionHeader
        eyebrow="Productivity dashboard"
        title="Behavior over rhetoric"
        description="Daily-updated stats designed to feel like Strava for Congress: reps, recovery, and accountability."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => {
          const band = metric.tone ? scoreBands[metric.tone] : scoreBands.neutral
          return (
            <div
              key={metric.label}
              className="flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:-translate-y-[2px] hover:border-amber-200 hover:shadow-md"
            >
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{metric.label}</p>
              <p className="text-3xl font-semibold text-slate-900">{metric.value}</p>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full ${band.bar}`} />
              </div>
              <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${band.chip}`}>
                {metric.change}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
