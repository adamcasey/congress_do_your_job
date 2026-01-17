import { BackButton } from '@/components/ui'
import { RepresentativeLookup } from '@/components/representatives/RepresentativeLookup'
import { FeatureFlagGuard } from '@/components/FeatureFlagGuard'
import { FeatureFlag } from '@/lib/feature-flags'
import { freePressFont } from '@/styles/fonts'

export const metadata = {
  title: 'Find Your Representatives - Congress Do Your Job',
  description: 'Look up your federal representatives by address. Find your senators and house representatives.',
}

export default function RepresentativesPage() {
  return (
    <FeatureFlagGuard flag={FeatureFlag.COMING_SOON_LANDING_PAGE}>
      <main className="min-h-screen bg-gradient-to-br from-[#e4f0f9] via-[#e4f0f9] to-[#fde3e0]">
        <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
          <BackButton href="/">Back to Dashboard</BackButton>

          <header className="mb-10 mt-8 text-center">
            <h1 className={`${freePressFont.className} text-4xl leading-tight tracking-tight text-slate-900 md:text-5xl lg:text-6xl mb-4`}>
              Find Your Representatives
            </h1>
            <h3 className="mx-auto max-w-2xl text-lg text-slate-600 text-balance">
              <span className="block">See who represents you and reach out directly.</span>
            </h3>
          </header>

          <div className="rounded-3xl bg-white/90 p-6 md:p-10 shadow-xl ring-1 ring-slate-200/80 backdrop-blur-sm">
            <RepresentativeLookup />
          </div>

          <footer className="mt-10 text-center">
            <p className="text-sm text-slate-500">
              Powered by 5 Calls API. Your address is not stored and is only used for lookup.
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Federal representatives only (House & Senate)
            </p>
          </footer>
        </div>
      </main>
    </FeatureFlagGuard>
  )
}
