import { useState } from 'react'
import type { ApiResponse } from '@/lib/api-response'

interface UseWaitlistSignupReturn {
  loading: boolean
  success: boolean
  error: string
  submitEmail: (email: string) => Promise<void>
  reset: () => void
}

export function useWaitlistSignup(): UseWaitlistSignupReturn {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const submitEmail = async (email: string) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/v1/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const result = (await response.json()) as ApiResponse<{ message: string }>

      if (!response.ok || !result.success) {
        const errorMessage = !result.success ? result.error : 'Something went wrong'
        throw new Error(errorMessage || 'Something went wrong')
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setSuccess(false)
    setError('')
  }

  return {
    loading,
    success,
    error,
    submitEmail,
    reset,
  }
}
