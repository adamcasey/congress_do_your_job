'use client'

import { WaitlistForm } from '@/components/forms/WaitlistForm'
import { BudgetCountdown } from '@/components/BudgetCountdown'
import { freePressFont } from '@/styles/fonts'
import { useLaunchDarkly } from '@/config/launchdarkly'
import { FeatureFlag, featureFlagDefaults } from '@/lib/feature-flags'

export default function ComingSoon() {
  const { flags, hasLdState } = useLaunchDarkly()

  const showBudgetTimer = hasLdState && FeatureFlag.BUDGET_BILL_TIMER in flags
    ? Boolean(flags[FeatureFlag.BUDGET_BILL_TIMER])
    : featureFlagDefaults[FeatureFlag.BUDGET_BILL_TIMER]

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#e4f0f9] via-[#e4f0f9] to-[#fde3e0]">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_50%,rgba(253,227,224,0.75)_50%)]" />
      <div className="absolute -left-28 -top-28 h-64 w-64 rotate-6 rounded-full bg-amber-200/40 blur-3xl" />
      <div className="absolute -right-16 bottom-10 h-72 w-72 rotate-12 rounded-full bg-emerald-200/40 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-6">
        <header className="mb-10 text-center">
          {showBudgetTimer && <BudgetCountdown />}
          <div className="flex flex-col items-center justify-center gap-3 text-slate-800">
            <h1 className={`${freePressFont.className} text-5xl leading-none tracking-tight text-slate-900 md:text-6xl lg:text-7xl`}>
              Congress Do Your Job
            </h1>
            <p className="text-xl font-semibold uppercase tracking-[0.22em] text-slate-500">Less theater. More legislation.</p>
          </div>
        </header>

        <section className="mx-auto grid max-w-5xl gap-10 rounded-[28px] bg-white/80 p-10 shadow-2xl shadow-amber-100/40 ring-1 ring-amber-100/70 md:items-center">
          <div className="space-y-6 text-slate-900">
            <p className="text-lg font-semibold uppercase tracking-[0.28em] text-slate-500">Coming soon</p>
            <h1 className="text-4xl font-black leading-tight md:text-5xl">
              A calm, plain-English dashboard for what Congress actually did this week.
            </h1>
            <p className="text-lg text-slate-700">
              Get notified when we launch: weekly briefings, accountability scorecards, and one-tap civic actions
              delivered without the partisanship and outrage.
            </p>

            <WaitlistForm />
          </div>
        </section>
      </div>
    </main>
  )
}
