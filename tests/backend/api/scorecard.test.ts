import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock scorecard services
const mockCollectScorecardData = vi.fn()
const mockCalculateScorecard = vi.fn()

vi.mock('@/services/scorecard-data-collector', () => ({
  collectScorecardData: (...args: unknown[]) => mockCollectScorecardData(...args),
}))

vi.mock('@/services/scorecard-calculator', () => ({
  calculateScorecard: (...args: unknown[]) => mockCalculateScorecard(...args),
}))

vi.mock('@/lib/congress-api', () => ({
  CongressApiError: class CongressApiError extends Error {
    constructor(message: string, public statusCode?: number) {
      super(message)
      this.name = 'CongressApiError'
    }
  },
}))

vi.mock('@/lib/cache', () => ({
  buildCacheKey: vi.fn((...args: string[]) => args.join(':')),
  getOrFetch: vi.fn(async (_key: string, fetcher: () => Promise<unknown>) => ({
    data: await fetcher(),
    status: 'MISS',
    isStale: false,
  })),
  CacheTTL: { SCORECARD: 21600 },
}))

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

import { GET } from '@/app/api/v1/scorecard/[bioguideId]/route'
import { CongressApiError } from '@/lib/congress-api'

function makeRequest(bioguideId: string, params: Record<string, string> = {}) {
  const url = new URL(`http://localhost/api/v1/scorecard/${bioguideId}`)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return new NextRequest(url)
}

function makeRouteParams(bioguideId: string) {
  return { params: Promise.resolve({ bioguideId }) }
}

const mockScorecard = {
  bioguideId: 'S001191',
  periodStart: new Date('2025-01-03'),
  periodEnd: new Date('2026-02-24'),
  totalScore: 72.5,
  grade: 'B',
  categoryScores: [],
  methodologyVersion: '1.0.0',
  calculatedAt: new Date(),
}

const mockDataSources = {
  attendance: 'default' as const,
  legislation: 'live' as const,
  bipartisanship: 'partial' as const,
  committeeWork: 'partial' as const,
  civility: 'default' as const,
  theaterRatio: 'default' as const,
}

describe('Scorecard API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCollectScorecardData.mockResolvedValue({
      input: { bioguideId: 'S001191' },
      dataSources: mockDataSources,
    })
    mockCalculateScorecard.mockReturnValue(mockScorecard)
  })

  it('returns scorecard for valid bioguideId', async () => {
    const response = await GET(makeRequest('S001191'), makeRouteParams('S001191'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.scorecard.bioguideId).toBe('S001191')
    expect(body.data.scorecard.totalScore).toBe(72.5)
    expect(body.data.scorecard.grade).toBe('B')
    expect(body.data.dataSources.legislation).toBe('live')
  })

  it('returns 400 for invalid bioguideId format', async () => {
    const response = await GET(makeRequest('invalid'), makeRouteParams('invalid'))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toContain('Invalid bioguideId')
  })

  it('returns 400 for lowercase bioguideId', async () => {
    const response = await GET(makeRequest('s001191'), makeRouteParams('s001191'))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.success).toBe(false)
  })

  it('returns 400 for invalid period parameter', async () => {
    const response = await GET(
      makeRequest('S001191', { period: 'weekly' }),
      makeRouteParams('S001191')
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('Invalid period')
  })

  it('accepts valid period parameters', async () => {
    for (const period of ['session', 'yearly', 'quarterly']) {
      const response = await GET(
        makeRequest('S001191', { period }),
        makeRouteParams('S001191')
      )
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.success).toBe(true)
    }
  })

  it('returns 404 when member not found', async () => {
    mockCollectScorecardData.mockRejectedValue(
      new CongressApiError('Not found', 404)
    )

    const response = await GET(makeRequest('Z999999'), makeRouteParams('Z999999'))
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.success).toBe(false)
    expect(body.error).toContain('Member not found')
  })

  it('returns 500 for Congress API errors', async () => {
    mockCollectScorecardData.mockRejectedValue(
      new CongressApiError('Server error', 500)
    )

    const response = await GET(makeRequest('S001191'), makeRouteParams('S001191'))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.success).toBe(false)
  })

  it('returns 500 for unexpected errors', async () => {
    mockCollectScorecardData.mockRejectedValue(new Error('Unexpected'))

    const response = await GET(makeRequest('S001191'), makeRouteParams('S001191'))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error).toBe('Failed to calculate scorecard')
  })

  it('includes cache headers in response', async () => {
    const response = await GET(makeRequest('S001191'), makeRouteParams('S001191'))

    expect(response.headers.get('X-Cache-Status')).toBe('MISS')
    expect(response.headers.get('X-Cache-Stale')).toBe('false')
  })

  it('calls collectScorecardData with correct bioguideId', async () => {
    await GET(makeRequest('S001191'), makeRouteParams('S001191'))

    expect(mockCollectScorecardData).toHaveBeenCalledWith(
      'S001191',
      expect.any(Date),
      expect.any(Date)
    )
  })

  it('passes collected data to calculateScorecard', async () => {
    await GET(makeRequest('S001191'), makeRouteParams('S001191'))

    expect(mockCalculateScorecard).toHaveBeenCalledWith({ bioguideId: 'S001191' })
  })
})
