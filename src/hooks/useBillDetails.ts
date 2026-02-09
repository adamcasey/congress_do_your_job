import { useEffect, useState } from 'react'
import type { ApiResponse } from '@/lib/api-response'
import { Bill } from '@/types/congress'

interface UseBillDetailsArgs {
  billType?: string
  billNumber?: string
  congress?: number
  enabled?: boolean
}

interface UseBillDetailsReturn {
  data: Bill | null
  loading: boolean
  error: string | null
}

export function useBillDetails({
  billType,
  billNumber,
  congress = 119,
  enabled = true,
}: UseBillDetailsArgs): UseBillDetailsReturn {
  const [data, setData] = useState<Bill | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !billType || !billNumber) {
      setLoading(false)
      setError(null)
      setData(null)
      return
    }

    let isActive = true
    const controller = new AbortController()

    const fetchDetails = async () => {
      setLoading(true)
      setError(null)
      setData(null)

      try {
        const response = await fetch(
          `/api/v1/legislation/bill?type=${encodeURIComponent(billType)}&number=${encodeURIComponent(billNumber)}&congress=${congress}`,
          { signal: controller.signal }
        )

        if (!isActive) {
          return
        }

        const result = (await response.json()) as ApiResponse<Bill>

        if (!response.ok || !result.success) {
          const errorMessage = !result.success ? result.error : 'Failed to load bill details'
          setError(errorMessage || 'Failed to load bill details')
          setData(null)
          return
        }

        setData(result.data)
      } catch (err) {
        if (!isActive || (err instanceof DOMException && err.name === 'AbortError')) {
          return
        }
        setError('Failed to load bill details')
        setData(null)
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    fetchDetails()

    return () => {
      isActive = false
      controller.abort()
    }
  }, [billType, billNumber, congress, enabled])

  return { data, loading, error }
}
