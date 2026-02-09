import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useRecentLegislation } from '@/hooks/useRecentLegislation'

describe('useRecentLegislation', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does not fetch when disabled', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useRecentLegislation({ enabled: false }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.current.data).toBeNull()
  })

  it('loads legislation data successfully', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        data: {
          bills: [],
          count: 0,
          lastUpdated: '2026-02-09T12:00:00Z',
        },
      }),
    }))

    const { result } = renderHook(() => useRecentLegislation({ limit: 10, days: 14 }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBeNull()
    expect(result.current.data).toEqual({
      bills: [],
      count: 0,
      lastUpdated: '2026-02-09T12:00:00Z',
    })
  })

  it('handles non-abort errors by setting error state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    const { result } = renderHook(() => useRecentLegislation())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.error).toBe('network down')
    expect(result.current.data).toBeNull()

  })
})
