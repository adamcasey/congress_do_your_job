import { SectionHeader } from './SectionHeader'
import { Official } from './types'

export function MemberProfiles({ officials }: { officials: Official[] }) {
  return (
    <section className="grid gap-6 rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-lg shadow-slate-200/60">
      <SectionHeader
        eyebrow="Member profiles"
        title="Behavior-first scorecards"
        description="Vote attendance, committee work, and documented decorum events. No party labels, no ideology."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {officials.map((official) => (
          <article
            key={official.name}
            className="flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:-translate-y-[2px] hover:border-amber-200 hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{official.office}</p>
                <h3 className="text-xl font-semibold text-slate-900">{official.name}</h3>
              </div>
              <div className="rounded-full bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white shadow-lg shadow-slate-900/40">
                {official.score}
              </div>
            </div>
            <p className="text-sm text-slate-600">{official.attendance}</p>
            <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800 ring-1 ring-emerald-100">
              {official.civilityNotes}
            </div>
            <button className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-800 underline-offset-4 hover:underline">
              Open profile
              <span aria-hidden>→</span>
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
