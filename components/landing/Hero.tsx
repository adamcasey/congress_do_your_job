export function Hero() {
  const headlineStats = [
    { label: 'Bills advanced', value: '14', detail: '+4 vs last week' },
    { label: 'Hearings', value: '22', detail: 'steady' },
    { label: 'Vote attendance', value: '94%', detail: '+1.5 pts' },
    { label: 'Deadlines overdue', value: '3', detail: 'needs attention' },
  ]

  return (
    <header className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 rounded-full border border-amber-100 bg-white/80 px-4 py-2 shadow-sm shadow-amber-100 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-tr from-amber-400 to-emerald-300 text-sm font-bold text-slate-900 shadow-glow">
            C
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">CongressDoYourJob</p>
            <p className="text-sm font-medium text-slate-700">Less theater. More laws.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 ring-1 ring-emerald-100">Public alpha</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 ring-1 ring-slate-200">
            Neutral, plain English
          </span>
        </div>
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-amber-100 bg-gradient-to-r from-amber-50 via-white to-emerald-50 px-8 py-10 shadow-xl shadow-amber-100/40">
        <div className="pointer-events-none absolute inset-0 bg-dot-grid bg-[size:22px_22px] opacity-40" />
        <div className="absolute inset-y-0 right-0 w-1/2 max-w-md bg-gradient-to-l from-emerald-100/50 via-white to-transparent blur-3xl" />
        <div className="relative grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 ring-1 ring-amber-100">
              Weekly civic briefing
            </p>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              What your representatives actually did this week — no spin, no red/blue.
            </h1>
            <p className="max-w-2xl text-lg text-slate-700">
              Plain-English updates on bills, attendance, hearings, and deadlines. Built for people who want facts
              without outrage.
            </p>
            <div className="flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background shadow-lg shadow-slate-300/60 transition hover:-translate-y-[1px] hover:shadow-xl hover:shadow-slate-300/80">
                See this week&apos;s briefing
                <span aria-hidden>→</span>
              </button>
              <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:-translate-y-[1px] hover:border-slate-300">
                Track your officials
              </button>
            </div>
          </div>
          <div className="relative grid gap-4 rounded-2xl bg-white/90 p-5 ring-1 ring-amber-100 backdrop-blur">
            <div className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-white shadow-lg shadow-slate-900/40">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-200">Do Your Job score</p>
                <p className="text-3xl font-semibold">78.4</p>
                <p className="text-xs text-slate-200">Congressional average • live every Monday</p>
              </div>
              <div className="flex flex-col items-end gap-1 text-xs text-emerald-200">
                <span className="rounded-full bg-white/10 px-3 py-1 font-semibold text-emerald-100">+1.7 pts</span>
                <span className="text-slate-200">Week over week</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm font-medium text-slate-800">
              {headlineStats.map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                  <p className="text-2xl font-semibold text-slate-900">{item.value}</p>
                  <p className="text-xs text-slate-500">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </header>
  )
}
