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
    // Don't fetch if placeholder or if we don't have the required data
    if (isPlaceholder) {
      return
    }

    // If no district, show message that this is Senate-only or invalid
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

    const fetchDistrictData = async () {
      setLoading(true)
      try {
        const response = await fetch(`/api/district?state=${state}&district=${district}`)
        const result = await response.json()

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
      } catch (error) {
        setData({
          districtName: `District ${district}`,
          population: null,
          medianAge: null,
          nextElection: null,
          error: 'Failed to load district data',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDistrictData()
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
    <div className="h-[200px] rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">District Snapshot</p>
          <h4 className="mt-1 text-lg font-semibold text-slate-900">
            {loading ? 'Loading...' : displayData?.districtName || 'District data unavailable'}
          </h4>
        </div>
        {isPlaceholder && (
          <span className="rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-semibold text-emerald-700">
            Example
          </span>
        )}
      </div>
      <div className="mt-4 grid gap-3 text-sm text-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Population</span>
          <span className="font-semibold text-slate-900">
            {loading ? '...' : formatPopulation(displayData?.population || null)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Median age</span>
          <span className="font-semibold text-slate-900">
            {loading ? '...' : displayData?.medianAge || 'N/A'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Next election</span>
          <span className="font-semibold text-slate-900">
            {loading ? '...' : displayData?.nextElection || 'N/A'}
          </span>
        </div>
      </div>
      {isPlaceholder && (
        <p className="mt-8 text-xs text-slate-500">District stats appear after lookup.</p>
      )}
      {!isPlaceholder && data?.error && (
        <p className="mt-4 text-xs text-amber-600">{data.error}</p>
      )}
    </div>
  )
}
