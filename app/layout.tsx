import type { Metadata } from 'next'
import './globals.css'
import { LaunchDarklyProvider } from '@/lib/launchdarkly-provider'

export const metadata: Metadata = {
  title: 'CongressDoYourJob.com',
  description: 'Less theater. More legislation. Non-partisan civic engagement platform tracking what elected officials actually do.',
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
