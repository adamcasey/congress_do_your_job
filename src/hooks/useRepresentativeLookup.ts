import { useState } from 'react'
import { Representative } from '@/types/representative'

interface UseRepresentativeLookupReturn {
  loading: boolean
  error: string
  representatives: Representative[]
  lookupByAddress: (address: string) => Promise<void>
  reset: () => void
}

export function useRepresentativeLookup(): UseRepresentativeLookupReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [representatives, setRepresentatives] = useState<Representative[]>([])

  const lookupByAddress = async (address: string) => {
    setLoading(true)
    setError('')
    setRepresentatives([])

    try {
      const response = await fetch(`/api/representatives?address=${encodeURIComponent(address)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch representatives')
      }

      setRepresentatives(data.representatives || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lookup representatives')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setRepresentatives([])
    setError('')
  }

  return {
    loading,
    error,
    representatives,
    lookupByAddress,
    reset,
  }
}
