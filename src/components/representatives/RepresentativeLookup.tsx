'use client'

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useAddressAutocomplete, useRepresentativeLookup } from '@/hooks'
import { EmptyState } from '@/components/ui'

type RepresentativeCardData = {
  id: string
  name: string
  area: string
  phone?: string
  url?: string
  photoURL?: string
}

const placeholderRepresentatives: RepresentativeCardData[] = [
  {
    id: 'placeholder-1',
    name: 'Avery Chen',
    area: 'US House',
    phone: '202-225-1188',
  },
  {
    id: 'placeholder-2',
    name: 'Jordan Lee',
    area: 'US Senate',
    phone: '202-224-1421',
  },
  {
    id: 'placeholder-3',
    name: 'Samira Patel',
    area: 'US Senate',
    phone: '202-224-6622',
  },
]

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function RepresentativeCard({
  rep,
  isPlaceholder = false,
}: {
  rep: RepresentativeCardData
  isPlaceholder?: boolean
}) {
  return (
    <div
      className={`flex h-[200px] items-center rounded-2xl border border-slate-200/80 p-4 shadow-sm ${
        isPlaceholder ? 'bg-slate-50/80' : 'bg-white'
      }`}
    >
      <div className="flex w-full items-center gap-4">
        {rep.photoURL ? (
          <Image
            src={rep.photoURL}
            alt={rep.name}
            width={56}
            height={56}
            unoptimized
            className="h-14 w-14 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
            {getInitials(rep.name)}
          </div>
        )}
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900">{rep.name}</h4>
          <p className="text-sm text-slate-600">{rep.area}</p>
          {rep.phone && <p className="mt-2 text-sm text-slate-700">{rep.phone}</p>}
          {rep.url ? (
            <a
              href={rep.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-sm text-amber-600 hover:text-amber-700"
            >
              Visit Website <span aria-hidden>&rarr;</span>
            </a>
          ) : (
            <p className="mt-1 text-xs text-slate-400">Example profile</p>
          )}
        </div>
      </div>
    </div>
  )
}

function DistrictSnapshotCard() {
  return (
    <div className="h-[200px] rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">District Snapshot</p>
          <h4 className="mt-1 text-lg font-semibold text-slate-900">Missouri - 02</h4>
        </div>
        <span className="rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-semibold text-emerald-700">
          Example
        </span>
      </div>
      <div className="mt-4 grid gap-3 text-sm text-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Population</span>
          <span className="font-semibold text-slate-900">766k</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Median age</span>
          <span className="font-semibold text-slate-900">38</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Next election</span>
          <span className="font-semibold text-slate-900">Nov 2026</span>
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-500">
        District stats appear after lookup.
      </p>
    </div>
  )
}

export function RepresentativeLookup() {
  const [address, setAddress] = useState('')
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const autocompleteRef = useRef<HTMLDivElement>(null)
  const { loading, error, representatives, lookupByAddress } = useRepresentativeLookup()
  const { predictions, fetchPredictions, clearPredictions } = useAddressAutocomplete()

  const handleAddressChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAddress(value)
    fetchPredictions(value)
    setShowAutocomplete(true)
  }

  const handleSelectPrediction = (description: string) => {
    setAddress(description)
    setShowAutocomplete(false)
    clearPredictions()
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setHasSearched(true)
    setShowAutocomplete(false)
    await lookupByAddress(address)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const representativeCards: RepresentativeCardData[] = representatives.map((rep) => ({
    id: rep.id,
    name: rep.name,
    area: rep.area,
    phone: rep.phone,
    url: rep.url,
    photoURL: rep.photoURL,
  }))

  const showPlaceholder = !hasSearched && !loading && representativeCards.length === 0
  const showEmpty = hasSearched && !loading && representativeCards.length === 0 && !error
  const cardsToShow = showPlaceholder ? placeholderRepresentatives : representativeCards

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
      <div className="space-y-6 lg:pr-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-slate-900">Enter Your Address</h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative" ref={autocompleteRef}>
            <label htmlFor="address" className="sr-only">
              Address
            </label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={handleAddressChange}
              placeholder="123 Main St, City, State ZIP"
              required
              disabled={loading}
              autoComplete="off"
              className="w-full h-12 rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
            />

            {showAutocomplete && predictions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {predictions.map((prediction) => (
                  <button
                    key={prediction.placeId}
                    type="button"
                    onClick={() => handleSelectPrediction(prediction.description)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 transition text-sm text-slate-700 border-b border-slate-100 last:border-b-0"
                  >
                    {prediction.description}
                  </button>
                ))}
              </div>
            )}

            <p className="mt-2 text-xs text-slate-500">
              We'll find your federal representatives (House & Senate)
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !address.trim()}
            className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-slate-900 px-6 text-base font-semibold text-white shadow-lg shadow-slate-900/30 transition hover:-translate-y-[1px] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {loading ? 'Looking up...' : 'Find My Representatives'}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-slate-900">
            {showPlaceholder ? 'Your Representatives' : hasSearched ? 'Your Representatives' : 'Example Results'}
          </h3>
          {!showPlaceholder && representativeCards.length > 0 && (
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              {representativeCards.length} results
            </span>
          )}
        </div>

        {loading && (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="h-28 rounded-2xl border border-slate-200/80 bg-slate-50/70"
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <EmptyState
            title="Unable to load representatives"
            message={error}
          />
        )}

        {!loading && showEmpty && (
          <EmptyState
            message="No representatives found for this address. Please check that you've entered a complete address with city, state, and ZIP code."
          />
        )}

        {!loading && showPlaceholder && (
          <div className="grid gap-4 md:grid-cols-2">
            {cardsToShow.map((rep) => (
              <RepresentativeCard key={rep.id} rep={rep} isPlaceholder />
            ))}
            <DistrictSnapshotCard />
          </div>
        )}

        {!loading && representativeCards.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {cardsToShow.map((rep) => (
              <RepresentativeCard key={rep.id} rep={rep} />
            ))}
            <DistrictSnapshotCard />
          </div>
        )}
      </div>
    </div>
  )
}
