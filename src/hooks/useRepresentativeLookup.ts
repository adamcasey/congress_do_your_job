import { useState } from 'react'
import type { ApiResponse } from '@/lib/api-response'
import { Representative } from '@/types/representative'

interface UseRepresentativeLookupReturn {
  loading: boolean
  error: string
  representatives: Representative[]
  location: string
  state: string
  district: string
  lookupByAddress: (address: string) => Promise<void>
  reset: () => void
}

export function useRepresentativeLookup(): UseRepresentativeLookupReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [representatives, setRepresentatives] = useState<Representative[]>([])
  const [location, setLocation] = useState('')
  const [state, setState] = useState('')
  const [district, setDistrict] = useState('')

  const lookupByAddress = async (address: string) => {
    setLoading(true)
    setError('')
    setRepresentatives([])
    setLocation('')
    setState('')
    setDistrict('')

    try {
      const response = await fetch(`/api/v1/representatives?address=${encodeURIComponent(address)}`)
      const result = (await response.json()) as ApiResponse<{
        representatives: Representative[]
        location: string
        state: string
        district: string
      }>

      if (!response.ok || !result.success) {
        const errorMessage = !result.success ? result.error : 'Failed to fetch representatives'
        throw new Error(errorMessage || 'Failed to fetch representatives')
      }

      setRepresentatives(result.data.representatives || [])
      setLocation(result.data.location || '')
      setState(result.data.state || '')
      setDistrict(result.data.district || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lookup representatives')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setRepresentatives([])
    setError('')
    setLocation('')
    setState('')
    setDistrict('')
  }

  return {
    loading,
    error,
    representatives,
    location,
    state,
    district,
    lookupByAddress,
    reset,
  }
}
