import Link from 'next/link'
import { SectionHeader } from './SectionHeader'
import { CivicAction } from './types'

export function CivicActionsSection({ actions }: { actions: CivicAction[] }) {
  return (
    <section className="grid gap-6 rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-lg shadow-slate-200/60">
      <SectionHeader
        eyebrow="Civic actions"
        title="Calm actions you can take in one tap"
        description="Carefully worded letters and petitions. No outrage. No party framing."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {actions.map((action) => (
          <article
            key={action.title}
            className="flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:-translate-y-[2px] hover:border-amber-200 hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{action.level}</p>
                <h3 className="text-lg font-semibold text-slate-900">{action.title}</h3>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-amber-800 ring-1 ring-amber-100">
                Ready
              </span>
            </div>
            <p className="text-sm text-slate-600">{action.summary}</p>
            <Link
              href={action.slug ? `/actions/${action.slug}` : action.id ? `/actions/${action.id}` : '/actions'}
              className="inline-flex w-fit items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-background shadow-sm shadow-slate-300/70 transition hover:-translate-y-[1px] hover:shadow"
            >
              {action.action}
              <span aria-hidden>→</span>
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}
