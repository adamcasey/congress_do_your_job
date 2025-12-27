import { notFound } from 'next/navigation'
import { getCivicActions } from '@/components/landing/data'

type Props = {
  params: { slug: string }
}

export default async function ActionDetailPage({ params }: Props) {
  const actions = await getCivicActions()
  const action = actions.find((item) => item.slug === params.slug || item.id === params.slug)

  if (!action) {
    notFound()
  }

  return (
    <main className="min-h-screen px-4 pb-16 pt-10 text-slate-900">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-lg shadow-slate-200/60">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Civic action</p>
        <h1 className="text-3xl font-semibold text-slate-900">{action.title}</h1>
        <p className="text-sm text-slate-700">{action.summary}</p>
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-background shadow-sm shadow-slate-300/70">
          {action.action}
        </div>
        <p className="text-xs text-slate-500">TODO: Wire to real petition/action handler.</p>
      </div>
    </main>
  )
}
