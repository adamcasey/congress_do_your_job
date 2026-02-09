import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useBillDetails } from '@/hooks/useBillDetails'

describe('useBillDetails', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('resets state when required params are missing', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useBillDetails({ enabled: true }))
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('loads bill details successfully', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        data: {
          type: 'HR',
          number: '1',
          congress: 119,
          originChamber: 'House',
          introducedDate: '2026-01-01',
          updateDate: '2026-02-01',
          updateDateIncludingText: '2026-02-01',
          title: 'Test Bill',
          url: '/bill',
        },
      }),
    }))

    const { result } = renderHook(() =>
      useBillDetails({ billType: 'HR', billNumber: '1', congress: 119 })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBeNull()
    expect(result.current.data?.title).toBe('Test Bill')
  })

  it('sets generic error on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')))
    const { result } = renderHook(() =>
      useBillDetails({ billType: 'HR', billNumber: '1', congress: 119 })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBe('Failed to load bill details')

  })
})
