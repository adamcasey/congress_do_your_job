import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Bill, Member, CongressApiResponse } from '@/types/congress'

// Mock the congress-api module before importing the service
vi.mock('@/lib/congress-api', () => ({
  getMember: vi.fn(),
  getMemberSponsoredLegislation: vi.fn(),
  getMemberCosponsoredLegislation: vi.fn(),
  CongressApiError: class CongressApiError extends Error {
    constructor(message: string, public statusCode?: number) {
      super(message)
      this.name = 'CongressApiError'
    }
  },
}))

// Mock cache to always miss (force fresh fetches in tests)
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

import { collectScorecardData } from '@/services/scorecard-data-collector'
import { getMember, getMemberSponsoredLegislation, getMemberCosponsoredLegislation } from '@/lib/congress-api'

const mockGetMember = vi.mocked(getMember)
const mockGetSponsored = vi.mocked(getMemberSponsoredLegislation)
const mockGetCosponsored = vi.mocked(getMemberCosponsoredLegislation)

// --- Test fixtures ---

function makeMember(overrides: Partial<Member> = {}): Member {
  return {
    bioguideId: 'S000148',
    name: 'Schumer, Charles E.',
    partyName: 'Democratic',
    state: 'New York',
    chamber: 'Senate',
    terms: [{ chamber: 'Senate', congress: 119, startYear: 2025, endYear: 2027 }],
    sponsoredLegislation: { count: 10, url: '' },
    cosponsoredLegislation: { count: 20, url: '' },
    ...overrides,
  }
}

function makeBill(overrides: Partial<Bill> = {}): Bill {
  return {
    number: '1234',
    type: 'S',
    congress: 119,
    originChamber: 'Senate',
    introducedDate: '2025-02-01',
    updateDate: '2025-03-01',
    updateDateIncludingText: '2025-03-01',
    title: 'Test Bill',
    url: 'https://api.congress.gov/v3/bill/119/s/1234',
    ...overrides,
  }
}

const PERIOD_START = new Date('2025-01-01')
const PERIOD_END = new Date('2025-06-30')

function setupMocks(
  member: Member = makeMember(),
  sponsoredBills: Bill[] = [],
  cosponsoredBills: Bill[] = []
) {
  mockGetMember.mockResolvedValue(member)
  mockGetSponsored.mockResolvedValue({
    bills: sponsoredBills,
    pagination: { count: sponsoredBills.length },
  } as CongressApiResponse<Bill>)
  mockGetCosponsored.mockResolvedValue({
    bills: cosponsoredBills,
    pagination: { count: cosponsoredBills.length },
  } as CongressApiResponse<Bill>)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('collectScorecardData', () => {
  it('returns a valid ScoringInput with correct bioguideId and period', async () => {
    setupMocks()

    const result = await collectScorecardData('S000148', PERIOD_START, PERIOD_END)

    expect(result.input.bioguideId).toBe('S000148')
    expect(result.input.periodStart).toEqual(PERIOD_START)
    expect(result.input.periodEnd).toEqual(PERIOD_END)
  })

  it('reports data source statuses correctly', async () => {
    setupMocks()

    const result = await collectScorecardData('S000148', PERIOD_START, PERIOD_END)

    expect(result.dataSources.legislation).toBe('live')
    expect(result.dataSources.bipartisanship).toBe('partial')
    expect(result.dataSources.committeeWork).toBe('partial')
    expect(result.dataSources.attendance).toBe('default')
    expect(result.dataSources.civility).toBe('default')
    expect(result.dataSources.theaterRatio).toBe('default')
  })

  it('calls Congress.gov API with correct bioguideId', async () => {
    setupMocks()

    await collectScorecardData('S000148', PERIOD_START, PERIOD_END)

    expect(mockGetMember).toHaveBeenCalledWith('S000148')
    expect(mockGetSponsored).toHaveBeenCalledWith('S000148', { limit: 250 })
    expect(mockGetCosponsored).toHaveBeenCalledWith('S000148', { limit: 250 })
  })

  it('returns neutral defaults for categories without API data', async () => {
    setupMocks()

    const result = await collectScorecardData('S000148', PERIOD_START, PERIOD_END)

    // Attendance: all zeros = no penalty (score of 100 in calculator)
    expect(result.input.attendance.totalVotes).toBe(0)
    expect(result.input.attendance.votesParticipated).toBe(0)

    // Civility: all zeros = baseline score of 80
    expect(result.input.civility.personalAttacksOnRecord).toBe(0)
    expect(result.input.civility.censuresOrReprimands).toBe(0)

    // Theater: all zeros = neutral score of 50
    expect(result.input.theaterRatio.legislativeActionsThisPeriod).toBe(0)
    expect(result.input.theaterRatio.socialMediaPostCount).toBe(0)
  })
})

describe('legislation data collection', () => {
  it('counts sponsored and cosponsored bills within the period', async () => {
    const sponsored = [
      makeBill({ number: '1', updateDate: '2025-03-01' }),
      makeBill({ number: '2', updateDate: '2025-04-15' }),
    ]
    const cosponsored = [
      makeBill({ number: '10', updateDate: '2025-02-15' }),
      makeBill({ number: '11', updateDate: '2025-05-01' }),
      makeBill({ number: '12', updateDate: '2025-05-20' }),
    ]

    setupMocks(makeMember(), sponsored, cosponsored)

    const result = await collectScorecardData('S000148', PERIOD_START, PERIOD_END)

    expect(result.input.legislation.billsSponsored).toBe(2)
    expect(result.input.legislation.billsCosponsored).toBe(3)
  })

  it('filters out bills outside the period', async () => {
    const sponsored = [
      makeBill({ number: '1', updateDate: '2025-03-01' }),    // in period
      makeBill({ number: '2', updateDate: '2024-12-15' }),    // before period
      makeBill({ number: '3', updateDate: '2025-08-01' }),    // after period
    ]

    setupMocks(makeMember(), sponsored, [])

    const result = await collectScorecardData('S000148', PERIOD_START, PERIOD_END)

    expect(result.input.legislation.billsSponsored).toBe(1)
  })

  it('detects enacted bills from action text', async () => {
    const sponsored = [
      makeBill({
        number: '1',
        updateDate: '2025-03-01',
        latestAction: { actionDate: '2025-03-01', text: 'Became Public Law No: 119-42.' },
      }),
    ]

    setupMocks(makeMember(), sponsored, [])

    const result = await collectScorecardData('S000148', PERIOD_START, PERIOD_END)

    expect(result.input.legislation.billsEnactedIntoLaw).toBe(1)
    expect(result.input.legislation.billsPassedChamber).toBe(1)
    expect(result.input.legislation.billsAdvancedPastCommittee).toBe(1)
  })

  it('detects bills that passed a chamber', async () => {
    const sponsored = [
      makeBill({
        number: '1',
        updateDate: '2025-03-01',
        latestAction: { actionDate: '2025-03-01', text: 'Passed Senate with amendments by Yea-Nay Vote.' },
      }),
    ]

    setupMocks(makeMember(), sponsored, [])

    const result = await collectScorecardData('S000148', PERIOD_START, PERIOD_END)

    expect(result.input.legislation.billsPassedChamber).toBe(1)
    expect(result.input.legislation.billsAdvancedPastCommittee).toBe(1)
    expect(result.input.legislation.billsEnactedIntoLaw).toBe(0)
  })

  it('detects bills reported out of committee', async () => {
    const sponsored = [
      makeBill({
        number: '1',
        updateDate: '2025-03-01',
        latestAction: { actionDate: '2025-03-01', text: 'Reported by the Committee on Finance. S. Rept. 119-45.' },
      }),
    ]

    setupMocks(makeMember(), sponsored, [])

    const result = await collectScorecardData('S000148', PERIOD_START, PERIOD_END)

    expect(result.input.legislation.billsAdvancedPastCommittee).toBe(1)
    expect(result.input.legislation.billsPassedChamber).toBe(0)
  })

  it('handles bills with no latestAction gracefully', async () => {
    const sponsored = [
      makeBill({ number: '1', updateDate: '2025-03-01', latestAction: undefined }),
    ]

    setupMocks(makeMember(), sponsored, [])

    const result = await collectScorecardData('S000148', PERIOD_START, PERIOD_END)

    expect(result.input.legislation.billsSponsored).toBe(1)
    expect(result.input.legislation.billsAdvancedPastCommittee).toBe(0)
    expect(result.input.legislation.billsPassedChamber).toBe(0)
    expect(result.input.legislation.billsEnactedIntoLaw).toBe(0)
  })
})

describe('bipartisanship data collection', () => {
  it('detects cross-party cosponsorships', async () => {
    const member = makeMember({ partyName: 'Democratic' })
    const cosponsored = [
      makeBill({
        number: '1',
        updateDate: '2025-03-01',
        sponsors: [{ bioguideId: 'R000001', fullName: 'Rep Republican', firstName: 'Rep', lastName: 'Republican', party: 'Republican', state: 'TX', url: '' }],
      }),
      makeBill({
        number: '2',
        updateDate: '2025-03-15',
        sponsors: [{ bioguideId: 'D000001', fullName: 'Dem Person', firstName: 'Dem', lastName: 'Person', party: 'Democratic', state: 'CA', url: '' }],
      }),
      makeBill({
        number: '3',
        updateDate: '2025-04-01',
        sponsors: [{ bioguideId: 'R000002', fullName: 'Rep Two', firstName: 'Rep', lastName: 'Two', party: 'Republican', state: 'FL', url: '' }],
      }),
    ]

    setupMocks(member, [], cosponsored)

    const result = await collectScorecardData('S000148', PERIOD_START, PERIOD_END)

    // 2 out of 3 cosponsored bills are from Republican sponsors
    expect(result.input.bipartisanship.crossPartyCosponsorships).toBe(2)
    expect(result.input.bipartisanship.totalCosponsorships).toBe(3)
  })

  it('detects bipartisan sponsored bills', async () => {
    const member = makeMember({ partyName: 'Republican' })
    const sponsored = [
      makeBill({
        number: '1',
        updateDate: '2025-03-01',
        cosponsors: [
          { bioguideId: 'D000001', fullName: 'Dem One', firstName: 'Dem', lastName: 'One', party: 'Democratic', state: 'NY', url: '', sponsorshipDate: '2025-02-01', isOriginalCosponsor: true },
        ],
      }),
      makeBill({
        number: '2',
        updateDate: '2025-04-01',
        cosponsors: [
          { bioguideId: 'R000099', fullName: 'Rep Same', firstName: 'Rep', lastName: 'Same', party: 'Republican', state: 'OH', url: '', sponsorshipDate: '2025-03-01', isOriginalCosponsor: true },
        ],
      }),
    ]

    setupMocks(member, sponsored, [])

    const result = await collectScorecardData('S000148', PERIOD_START, PERIOD_END)

    // Bill 1 has a Democratic cosponsor (cross-party), bill 2 only has same-party
    expect(result.input.bipartisanship.bipartisanBillsSponsored).toBe(1)
    expect(result.input.bipartisanship.totalBillsSponsored).toBe(2)
  })

  it('handles member with no cosponsorships', async () => {
    setupMocks(makeMember(), [], [])

    const result = await collectScorecardData('S000148', PERIOD_START, PERIOD_END)

    expect(result.input.bipartisanship.totalCosponsorships).toBe(0)
    expect(result.input.bipartisanship.crossPartyCosponsorships).toBe(0)
  })
})

describe('error handling', () => {
  it('propagates Congress.gov API errors', async () => {
    const { CongressApiError } = await import('@/lib/congress-api')
    mockGetMember.mockRejectedValue(new CongressApiError('Member not found', 404))

    await expect(
      collectScorecardData('INVALID', PERIOD_START, PERIOD_END, { skipCache: true })
    ).rejects.toThrow('Member not found')
  })
})
