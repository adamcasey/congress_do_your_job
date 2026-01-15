'use client'

import { useState, FormEvent, ChangeEvent } from 'react'
import { useRepresentativeLookup } from '@/hooks'
import { EmptyState } from '@/components/ui'

export function AddressLookupForm() {
  const [address, setAddress] = useState('')
  const { loading, representatives, lookupByAddress } = useRepresentativeLookup()
  const [hasSearched, setHasSearched] = useState(false)

  const handleAddressChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setHasSearched(true)
    await lookupByAddress(address)
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="address" className="block text-sm font-semibold text-slate-700 mb-2">
            Enter Your Address
          </label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={handleAddressChange}
            placeholder="123 Main St, City, State ZIP"
            required
            disabled={loading}
            className="w-full h-12 rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="mt-2 text-xs text-slate-500">
            We&apos;ll find your federal representatives (House & Senate)
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !address.trim()}
          className="inline-flex h-12 items-center justify-center rounded-lg bg-slate-900 px-8 text-base font-semibold text-white shadow-lg shadow-slate-900/30 transition hover:-translate-y-[1px] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {loading ? 'Looking up...' : 'Find My Representatives'}
        </button>
      </form>

      {hasSearched && !loading && representatives.length === 0 && (
        <EmptyState
          message="No representatives found for this address. Please check that you've entered a complete address with city, state, and ZIP code."
        />
      )}

      {representatives.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Your Representatives</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {representatives.map((rep, index) => (
              <div
                key={index}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  {rep.photoUrl && (
                    <img
                      src={rep.photoUrl}
                      alt={rep.name}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">{rep.name}</h4>
                    <p className="text-sm text-slate-600">{rep.office}</p>
                    {rep.phones && rep.phones.length > 0 && (
                      <p className="text-sm text-slate-700 mt-2">{rep.phones[0]}</p>
                    )}
                    {rep.urls && rep.urls.length > 0 && (
                      <a
                        href={rep.urls[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-amber-600 hover:text-amber-700 mt-1 inline-block"
                      >
                        Visit Website →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
