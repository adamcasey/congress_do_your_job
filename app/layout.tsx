import type { Metadata } from 'next'
import { Newsreader, Space_Grotesk } from 'next/font/google'
import './globals.css'

const sans = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const serif = Newsreader({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'CongressDoYourJob.com',
  description:
    'Less theater. More laws. A calm, non-partisan platform tracking what elected officials actually do.',
  openGraph: {
    title: 'CongressDoYourJob.com',
    description:
      'Plain-English briefings, accountability dashboards, and neutral scorecards for every elected official.',
    url: 'https://congressdoyourjob.com',
    siteName: 'CongressDoYourJob.com',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
