import { useEffect, useState } from 'react'

export interface DistrictData {
  districtName: string
  population: number | null
  medianAge: number | null
  nextElection: string | null
  error?: string
}

interface UseDistrictSnapshotArgs {
  state?: string
  district?: string
  isPlaceholder?: boolean
}

interface UseDistrictSnapshotReturn {
  data: DistrictData | null
  loading: boolean
}

export function useDistrictSnapshot({
  state,
  district,
  isPlaceholder = false,
}: UseDistrictSnapshotArgs): UseDistrictSnapshotReturn {
  const [data, setData] = useState<DistrictData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isPlaceholder) {
      setLoading(false)
      setData(null)
      return
    }

    if (!state || !district) {
      setLoading(false)
      setData({
        districtName: 'No district data',
        population: null,
        medianAge: null,
        nextElection: null,
        error: 'District information not available',
      })
      return
    }

    let isActive = true
    const controller = new AbortController()

    const fetchDistrict = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `/api/v1/district?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`,
          { signal: controller.signal }
        )
        const result = await response.json()

        if (!isActive) {
          return
        }

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
        if (!isActive || (error instanceof DOMException && error.name === 'AbortError')) {
          return
        }
        setData({
          districtName: `District ${district}`,
          population: null,
          medianAge: null,
          nextElection: null,
          error: 'Failed to load district data',
        })
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    fetchDistrict()

    return () => {
      isActive = false
      controller.abort()
    }
  }, [state, district, isPlaceholder])

  return { data, loading }
}
