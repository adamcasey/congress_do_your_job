export function NewsletterSection() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-amber-50 px-8 py-10 shadow-lg shadow-emerald-100/50">
      <div className="pointer-events-none absolute inset-0 bg-dot-grid bg-[size:20px_20px] opacity-50" />
      <div className="relative grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">Stay in the loop</p>
          <h3 className="text-3xl font-semibold text-slate-900">Weekly inbox briefing</h3>
          <p className="max-w-xl text-sm text-slate-700">
            Every Monday morning: what moved, what stalled, what slipped, and what to expect next week. Free while we
            build; premium tier will add personalized tracking.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-slate-700">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
              Neutral. No outrage.
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
              Plain English summaries
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
              Primary source links
            </span>
          </div>
        </div>
        <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
          <label className="text-sm font-semibold text-slate-800" htmlFor="email">
            Get the Monday briefing
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200"
          />
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-semibold text-background shadow-lg shadow-slate-400/40 transition hover:-translate-y-[1px] hover:shadow-xl"
          >
            Join the list
            <span aria-hidden>→</span>
          </button>
          <p className="text-xs text-slate-500">
            TODO: wire up to email service (Resend or Mailgun). No spam, ever.
          </p>
        </form>
      </div>
    </section>
  )
}
