import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CongressDoYourJob.com',
  description: 'Less theater. More laws. Non-partisan civic engagement platform tracking what elected officials actually do.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
