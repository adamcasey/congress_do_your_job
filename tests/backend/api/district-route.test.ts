import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/v1/district/route'

const {
  buildCacheKeyMock,
  getOrFetchMock,
  stateAbbrToFipsMock,
  getNextHouseElectionMock,
  formatElectionDateMock,
} = vi.hoisted(() => ({
  buildCacheKeyMock: vi.fn(),
  getOrFetchMock: vi.fn(),
  stateAbbrToFipsMock: vi.fn(),
  getNextHouseElectionMock: vi.fn(),
  formatElectionDateMock: vi.fn(),
}))

vi.mock('@/lib/cache', () => ({
  buildCacheKey: buildCacheKeyMock,
  getOrFetch: getOrFetchMock,
  CacheTTL: {
    DISTRICT_DATA: 3600,
  },
}))

vi.mock('@/lib/states', () => ({
  stateAbbrToFips: stateAbbrToFipsMock,
}))

vi.mock('@/lib/elections', () => ({
  getNextHouseElection: getNextHouseElectionMock,
  formatElectionDate: formatElectionDateMock,
}))

function createRequest(url: string) {
  return {
    nextUrl: new URL(url),
  } as any
}

describe('GET /api/v1/district', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getNextHouseElectionMock.mockReturnValue(new Date('2026-11-03T12:00:00Z'))
    formatElectionDateMock.mockReturnValue('Nov 2026')
    buildCacheKeyMock.mockReturnValue('cache:key')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns 400 when required params are missing', async () => {
    const response = await GET(createRequest('https://app.test/api/v1/district'))
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'State and district parameters are required',
    })
  })

  it('returns 400 for invalid state abbreviations', async () => {
    stateAbbrToFipsMock.mockReturnValue(null)
    const response = await GET(createRequest('https://app.test/api/v1/district?state=XX&district=2'))
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Invalid state: XX' })
  })

  it('returns transformed district data with cache metadata', async () => {
    stateAbbrToFipsMock.mockReturnValue('29')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(JSON.stringify([
        ['NAME', 'B01003_001E', 'B01002_001E'],
        ['Missouri Congressional District 2', '766000', '38.2'],
      ])),
    }))

    getOrFetchMock.mockImplementation(async (_key, fetcher) => ({
      data: await fetcher(),
      status: 'MISS',
      isStale: false,
      age: 30,
    }))

    const response = await GET(createRequest('https://app.test/api/v1/district?state=MO&district=2'))
    expect(response.status).toBe(200)
    expect(response.headers.get('x-cache-status')).toBe('MISS')
    expect(response.headers.get('x-cache-stale')).toBe('false')
    expect(response.headers.get('x-cache-age')).toBe('30')

    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        state: '29',
        district: '02',
        districtName: 'Missouri Congressional District 2',
        population: 766000,
        medianAge: 38.2,
        nextElection: 'Nov 2026',
      },
    })
  })

  it('normalizes at-large district labels', async () => {
    stateAbbrToFipsMock.mockReturnValue('02')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(JSON.stringify([
        ['NAME', 'B01003_001E', 'B01002_001E'],
        ['Alaska At-Large Congressional District', '736081', '36.9'],
      ])),
    }))
    getOrFetchMock.mockImplementation(async (_key, fetcher) => ({
      data: await fetcher(),
      status: 'MISS',
      isStale: false,
    }))

    const response = await GET(createRequest('https://app.test/api/v1/district?state=AK&district=1'))
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: expect.objectContaining({
        districtName: 'At-Large District',
      }),
    })
  })

  it('returns 500 when census API request fails', async () => {
    stateAbbrToFipsMock.mockReturnValue('29')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue('error'),
    }))
    getOrFetchMock.mockImplementation(async (_key, fetcher) => ({
      data: await fetcher(),
      status: 'MISS',
      isStale: false,
    }))

    const response = await GET(createRequest('https://app.test/api/v1/district?state=MO&district=2'))
    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'Failed to fetch district data',
    })
  })
})
