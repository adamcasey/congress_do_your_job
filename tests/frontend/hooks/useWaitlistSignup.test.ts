import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useWaitlistSignup } from '@/hooks/useWaitlistSignup'

describe('useWaitlistSignup', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('submits email successfully', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        data: { message: 'ok' },
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useWaitlistSignup())

    await act(async () => {
      await result.current.submitEmail('person@example.com')
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/waitlist', expect.any(Object))
    expect(result.current.success).toBe(true)
    expect(result.current.error).toBe('')
    expect(result.current.loading).toBe(false)
  })

  it('captures server-side error messages', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({
        success: false,
        error: 'Already on waitlist',
      }),
    }))

    const { result } = renderHook(() => useWaitlistSignup())

    await act(async () => {
      await result.current.submitEmail('person@example.com')
    })

    expect(result.current.success).toBe(false)
    expect(result.current.error).toBe('Already on waitlist')
    expect(result.current.loading).toBe(false)
  })

  it('falls back to generic error on thrown non-error values', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('boom'))

    const { result } = renderHook(() => useWaitlistSignup())

    await act(async () => {
      await result.current.submitEmail('person@example.com')
    })

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to sign up')
    })
  })

  it('resets success and error state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        data: { message: 'ok' },
      }),
    }))

    const { result } = renderHook(() => useWaitlistSignup())

    await act(async () => {
      await result.current.submitEmail('person@example.com')
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.success).toBe(false)
    expect(result.current.error).toBe('')
  })
})
