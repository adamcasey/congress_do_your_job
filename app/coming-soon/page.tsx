'use client'

import Image from 'next/image'

export default function ComingSoon() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#e4f0f9] via-[#e4f0f9] to-[#fde3e0]">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_50%,rgba(253,227,224,0.75)_50%)]" />
      <div className="absolute -left-28 -top-28 h-64 w-64 rotate-6 rounded-full bg-amber-200/40 blur-3xl" />
      <div className="absolute -right-16 bottom-10 h-72 w-72 rotate-12 rounded-full bg-emerald-200/40 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
        <header className="mb-10">
          <div className="flex items-center gap-3 text-slate-800">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/90 text-xl font-bold shadow-sm ring-1 ring-amber-100">
              <Image src="/logos/favicon.png" alt="CongressDoYourJob logo" width={36} height={36} />
            </span>
            <div>
              <p className="text-xl font-semibold uppercase tracking-[0.22em] text-slate-500">Less theater. More legislation.</p>
            </div>
          </div>
        </header>

        <section className="grid gap-10 rounded-[28px] bg-white/80 p-10 shadow-2xl shadow-amber-100/40 ring-1 ring-amber-100/70 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div className="space-y-6 text-slate-900">
            <p className="text-lg font-semibold uppercase tracking-[0.28em] text-slate-500">Coming soon</p>
            <h1 className="text-4xl font-black leading-tight md:text-5xl">
              A calm, plain-English dashboard for what Congress actually did this week.
            </h1>
            <p className="text-lg text-slate-700">
              Get notified when we launch: weekly briefings, accountability scorecards, and one-tap civic actions
              — no partisanship, no outrage.
            </p>

            <form
              className="flex flex-col gap-3 md:flex-row md:items-center"
              onSubmit={(e) => {
                e.preventDefault()
              }}
            >
              <input
                type="text"
                name="name"
                placeholder="Name"
                className="h-12 w-full rounded-full border border-slate-200 bg-white px-5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200 md:w-48"
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="h-12 w-full rounded-full border border-slate-200 bg-white px-5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200 md:w-64"
              />
              <button
                type="submit"
                className="inline-flex h-12 min-w-[12rem] items-center justify-center rounded-full bg-slate-900 px-8 text-sm font-semibold text-white shadow-lg shadow-slate-900/30 transition hover:-translate-y-[1px] hover:shadow-xl"
              >
                Notify me
              </button>
            </form>
            <p className="text-sm text-slate-500">
              No spam. We&apos;ll email you once when the public preview is live.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6 shadow-inner ring-1 ring-amber-100">
            <div className="absolute inset-0 bg-dot-grid bg-[size:18px_18px] opacity-40" />
            <div className="relative flex flex-col items-center gap-4 text-center">
              <div className="grid h-20 w-20 place-items-center rounded-2xl bg-white shadow-md ring-1 ring-amber-100">
                <svg viewBox="0 0 64 64" className="h-12 w-12 text-amber-600" fill="none" stroke="currentColor">
                  <path
                    d="M12 28h40M12 36h40M16 18h32l4 10H12l4-10Zm0 0L24 8h16l8 10M16 36v20h32V36"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">Up next</p>
              <p className="text-base font-semibold text-slate-900">Weekly civic briefing</p>
              <p className="text-sm text-slate-600">
                Bills moved, hearings held, deadlines missed, and what to expect next week — all in plain English.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
