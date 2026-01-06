'use client'

import { useFlags } from 'launchdarkly-react-client-sdk'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const { showComingSoon } = useFlags()
  const router = useRouter()

  useEffect(() => {
    if (showComingSoon) {
      router.push('/coming-soon')
    }
  }, [showComingSoon, router])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          CongressDoYourJob.com
        </h1>
        <p className="text-xl text-center text-gray-600">
          Less theater. More laws.
        </p>
      </div>
    </main>
  )
}
