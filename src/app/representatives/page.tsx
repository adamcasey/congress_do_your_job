import { AddressLookupForm } from '@/components/forms/AddressLookupForm'
import { freePressFont } from '@/styles/fonts'

export const metadata = {
  title: 'Find Your Representatives - Congress Do Your Job',
  description: 'Look up your federal representatives by address. Find your senators and house representatives.',
}

export default function RepresentativesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#e4f0f9] via-[#e4f0f9] to-[#fde3e0]">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <header className="mb-12 text-center">
          <h1 className={`${freePressFont.className} text-4xl leading-none tracking-tight text-slate-900 md:text-5xl lg:text-6xl mb-4`}>
            Find Your Representatives
          </h1>
          <p className="text-lg text-slate-600">
            Enter your address to see who represents you in Congress
          </p>
        </header>

        <div className="rounded-2xl bg-white/90 p-8 shadow-xl ring-1 ring-slate-200 backdrop-blur-sm">
          <AddressLookupForm />
        </div>

        <footer className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            We use the Google Civic Information API to find your representatives.
            Your address is not stored.
          </p>
        </footer>
      </div>
    </main>
  )
}
