import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useBillSummary } from '@/hooks/useBillSummary'

describe('useBillSummary', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does not fetch when disabled', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useBillSummary({ enabled: false }))
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('loads bill summary successfully', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        data: {
          summary: 'Summary text',
          source: 'generated',
          generatedAt: '2026-02-09T12:00:00Z',
        },
      }),
    }))

    const { result } = renderHook(() =>
      useBillSummary({ billType: 'HR', billNumber: '1', congress: 119 })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.data?.summary).toBe('Summary text')
    expect(result.current.error).toBeNull()
  })

  it('sets error message on request failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')))
    const { result } = renderHook(() =>
      useBillSummary({ billType: 'HR', billNumber: '1', congress: 119 })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.error).toBe('Failed to load bill summary')

  })
})
