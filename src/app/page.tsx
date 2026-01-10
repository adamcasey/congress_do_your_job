'use client'

import { useFlags } from 'launchdarkly-react-client-sdk'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { FeatureFlag, featureFlagDefaults } from '@/lib/feature-flags'
import { freePressFont, latoFont } from '@/styles/fonts'

export default function Home() {
  const flags = useFlags()
  const router = useRouter()

  const showComingSoon = flags[FeatureFlag.COMING_SOON_LANDING_PAGE] ?? featureFlagDefaults[FeatureFlag.COMING_SOON_LANDING_PAGE]

  useEffect(() => {
    if (showComingSoon) {
      router.push('/coming-soon')
    }
  }, [showComingSoon, router])

  return (
    <main className={`flex min-h-screen flex-col items-center justify-center p-24 ${latoFont.className}`}>
      <div className="z-10 w-full max-w-5xl items-center justify-center text-sm">
        <h1 className={`mb-8 text-center text-4xl ${freePressFont.className}`}>
          Less theater. More legislation.
        </h1>
      </div>
    </main>
  )
}
