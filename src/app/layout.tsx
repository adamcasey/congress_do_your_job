import type { Metadata } from 'next'
import './globals.css'
import { LaunchDarklyProvider } from '@/lib/launchdarkly-provider'

export const metadata: Metadata = {
  title: 'Congress Do Your Job',
  description: 'A calm, plain-English dashboard for what Congress actually did this week. Non-partisan civic engagement with weekly briefings and accountability scorecards.',
  metadataBase: new URL('https://congressdoyourjob.com'),
  openGraph: {
    title: 'Congress Do Your Job',
    description: 'Less theater. More legislation. Track what elected officials actually do.',
    url: 'https://congressdoyourjob.com',
    siteName: 'Congress Do Your Job',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Congress Do Your Job',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Congress Do Your Job',
    description: 'Less theater. More legislation.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <LaunchDarklyProvider>{children}</LaunchDarklyProvider>
      </body>
    </html>
  )
}
