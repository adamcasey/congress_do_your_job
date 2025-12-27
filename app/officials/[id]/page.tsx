import { notFound } from 'next/navigation'
import { getOfficials } from '@/components/landing/data'

type Props = {
  params: { id: string }
}

export default async function OfficialDetailPage({ params }: Props) {
  const officials = await getOfficials()
  const official = officials.find((item) => item.id === params.id || item.slug === params.id)

  if (!official) {
    notFound()
  }

  return (
    <main className="min-h-screen px-4 pb-16 pt-10 text-slate-900">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-lg shadow-slate-200/60">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Elected official</p>
        <h1 className="text-3xl font-semibold text-slate-900">{official.name}</h1>
        <p className="text-sm text-slate-700">{official.office}</p>
        <div className="flex flex-wrap gap-3">
          <span className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/40">
            Do Your Job score: {official.score}
          </span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800 ring-1 ring-emerald-100">
            {official.attendance}
          </span>
        </div>
        <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800 ring-1 ring-emerald-100">
          {official.civilityNotes}
        </div>
        <p className="text-xs text-slate-500">
          Attendance, bills, committees, and decorum events will sync from the data feeds.
        </p>
      </div>
    </main>
  )
}
