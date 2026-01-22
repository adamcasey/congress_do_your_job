import { useState } from 'react'
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
      const response = await fetch(`/api/representatives?address=${encodeURIComponent(address)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch representatives')
      }

      setRepresentatives(data.representatives || [])
      setLocation(data.location || '')
      setState(data.state || '')
      setDistrict(data.district || '')
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
