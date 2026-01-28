'use client'

import { useEffect, useState } from 'react'

interface DistrictSnapshotCardProps {
  state?: string
  district?: string
  isPlaceholder?: boolean
}

interface DistrictData {
  districtName: string
  population: number | null
  medianAge: number | null
  nextElection: string | null
  error?: string
}

export function DistrictSnapshotCard({ state, district, isPlaceholder = false }: DistrictSnapshotCardProps) {
  const [data, setData] = useState<DistrictData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isPlaceholder) {
      return
    }

    if (!state || !district) {
      setData({
        districtName: 'No district data',
        population: null,
        medianAge: null,
        nextElection: null,
        error: 'District information not available',
      })
      return
    }

    setLoading(true)
    fetch(`/api/v1/district?state=${state}&district=${district}`)
      .then((response) => response.json().then((result) => ({ response, result })))
      .then(({ response, result }) => {
        if (response.ok) {
          setData(result)
        } else {
          setData({
            districtName: `District ${district}`,
            population: null,
            medianAge: null,
            nextElection: null,
            error: result.error || 'Unable to load district data',
          })
        }
      })
      .catch(() => {
        setData({
          districtName: `District ${district}`,
          population: null,
          medianAge: null,
          nextElection: null,
          error: 'Failed to load district data',
        })
      })
      .finally(() => {
        setLoading(false)
      })
  }, [state, district, isPlaceholder])

  const formatPopulation = (pop: number | null): string => {
    if (!pop) return 'N/A'
    if (pop >= 1000000) return `${(pop / 1000000).toFixed(1)}M`
    if (pop >= 1000) return `${Math.round(pop / 1000)}k`
    return pop.toLocaleString()
  }

  const displayData = isPlaceholder
    ? { districtName: 'Missouri - 02', population: 766000, medianAge: 38, nextElection: 'Nov 2026' }
    : data

  return (
    <div className="flex h-[200px] flex-col overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
            District Snapshot
          </p>
          <h4 className="mt-1 text-base font-semibold leading-snug text-slate-900">
            {loading ? 'Loading...' : displayData?.districtName || 'District data unavailable'}
          </h4>
        </div>
        {isPlaceholder && (
          <span className="rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-semibold text-emerald-700">
            Example
          </span>
        )}
      </div>
      <div className="mt-3 grid gap-2 text-xs text-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Population</span>
          <span className="text-sm font-semibold text-slate-900">
            {loading ? '...' : formatPopulation(displayData?.population || null)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Median age</span>
          <span className="text-sm font-semibold text-slate-900">
            {loading ? '...' : displayData?.medianAge || 'N/A'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Next election</span>
          <span className="text-sm font-semibold text-slate-900">
            {loading ? '...' : displayData?.nextElection || 'N/A'}
          </span>
        </div>
      </div>
      {isPlaceholder && (
        <p className="mt-auto pt-2 text-[11px] text-slate-500">District stats appear after lookup.</p>
      )}
      {!isPlaceholder && data?.error && (
        <p className="mt-auto pt-2 text-[11px] text-amber-600">{data.error}</p>
      )}
    </div>
  )
}
