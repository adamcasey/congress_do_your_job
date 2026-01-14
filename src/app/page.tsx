import { redirect } from 'next/navigation'
import { getServerFlag } from '@/lib/launchdarkly-server'
import { FeatureFlag } from '@/lib/feature-flags'
import { freePressFont, latoFont } from '@/styles/fonts'

export default async function Home() {
  const showComingSoon = await getServerFlag(FeatureFlag.COMING_SOON_LANDING_PAGE)

  if (showComingSoon) {
    redirect('/coming-soon')
  }

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
