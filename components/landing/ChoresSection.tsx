import { StatusBadge } from './StatusBadge'
import { SectionHeader } from './SectionHeader'
import { ChoreItem } from './types'

export function ChoresSection({ chores }: { chores: ChoreItem[] }) {
  return (
    <section className="grid gap-6 rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-lg shadow-slate-200/60">
      <SectionHeader
        eyebrow="Chores list"
        title="What Congress still owes the public"
        description="The accountability board. Each task gets a due date, current status, and why it matters."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {chores.map((chore) => (
          <article
            key={chore.title}
            className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:-translate-y-[2px] hover:border-amber-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{chore.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{chore.impact}</p>
              </div>
              <StatusBadge status={chore.status} />
            </div>
            <div className="mt-3 flex items-center justify-between text-sm font-medium text-slate-700">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-amber-800 ring-1 ring-amber-100">
                <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden />
                {chore.due}
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {chore.source}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
