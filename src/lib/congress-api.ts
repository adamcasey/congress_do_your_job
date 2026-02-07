import { CongressApiResponse, Bill, Member, Vote, Amendment } from '@/types/congress'

const CONGRESS_API_BASE = 'https://api.congress.gov/v3'
const CURRENT_CONGRESS = 119 // 119th Congress (2025-2027)

/**
 * Congress.gov API client
 * Provides resilient access to legislative data with error handling
 */

interface FetchOptions {
  limit?: number
  offset?: number
  sort?: 'updateDate+desc' | 'updateDate+asc'
  fromDateTime?: string
  toDateTime?: string
}

class CongressApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public responseBody?: unknown
  ) {
    super(message)
    this.name = 'CongressApiError'
  }
}

/**
 * Build Congress.gov API URL with authentication
 */
function buildApiUrl(
  path: string,
  params?: Record<string, string | number | undefined>
): string {
  const apiKey = process.env.CONGRESS_API_KEY

  if (!apiKey) {
    throw new CongressApiError('CONGRESS_API_KEY environment variable not configured')
  }

  const url = new URL(`${CONGRESS_API_BASE}${path}`)
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('format', 'json')

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value))
      }
    })
  }

  return url.toString()
}

/**
 * Fetch from Congress.gov API with error handling
 */
async function fetchCongressApi<T>(
  path: string,
  params?: Record<string, string | number | undefined>
): Promise<CongressApiResponse<T>> {
  const url = buildApiUrl(path, params)

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CongressDoYourJob.com/1.0',
      },
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new CongressApiError(
        `Congress.gov API error: ${response.status} ${response.statusText}`,
        response.status,
        errorBody
      )
    }

    return await response.json()
  } catch (error) {
    if (error instanceof CongressApiError) {
      throw error
    }

    throw new CongressApiError(
      `Failed to fetch from Congress.gov API: ${error instanceof Error ? error.message : 'Unknown error'}`,
      undefined,
      error
    )
  }
}

/**
 * Get list of bills with optional filtering
 */
export async function getBills(
  options: FetchOptions = {}
): Promise<CongressApiResponse<Bill>> {
  const {
    limit = 20,
    offset = 0,
    sort = 'updateDate+desc',
    fromDateTime,
    toDateTime,
  } = options

  return fetchCongressApi<Bill>(`/bill/${CURRENT_CONGRESS}`, {
    limit,
    offset,
    sort,
    fromDateTime,
    toDateTime,
  })
}

/**
 * Get specific bill details (single bill)
 */
export async function getBill(
  billType: string,
  billNumber: string,
  congress: number = CURRENT_CONGRESS
): Promise<Bill> {
  const response = await fetchCongressApi<Bill>(
    `/bill/${congress}/${billType.toLowerCase()}/${billNumber}`
  )

  if (!response.bill) {
    throw new CongressApiError(`Bill ${billType} ${billNumber} not found`, 404)
  }

  return response.bill
}

/**
 * Get bill actions (legislative history)
 */
export async function getBillActions(
  billType: string,
  billNumber: string,
  congress: number = CURRENT_CONGRESS,
  options: FetchOptions = {}
): Promise<CongressApiResponse<Bill>> {
  const { limit = 20, offset = 0 } = options

  return fetchCongressApi<Bill>(
    `/bill/${congress}/${billType.toLowerCase()}/${billNumber}/actions`,
    { limit, offset }
  )
}

/**
 * Get bill summaries
 */
export async function getBillSummaries(
  billType: string,
  billNumber: string,
  congress: number = CURRENT_CONGRESS
): Promise<CongressApiResponse<Bill>> {
  return fetchCongressApi<Bill>(
    `/bill/${congress}/${billType.toLowerCase()}/${billNumber}/summaries`
  )
}

/**
 * Get bills by subject/policy area
 */
export async function getBillsBySubject(
  subject: string,
  options: FetchOptions = {}
): Promise<CongressApiResponse<Bill>> {
  // Note: Congress.gov API doesn't have direct subject filtering
  // This would require fetching bills and filtering client-side
  // or using a different approach
  throw new Error('Subject filtering not yet implemented')
}

/**
 * Get member information
 */
export async function getMember(bioguideId: string): Promise<Member> {
  const response = await fetchCongressApi<Member>(`/member/${bioguideId}`)

  if (!response.members || response.members.length === 0) {
    throw new CongressApiError(`Member ${bioguideId} not found`, 404)
  }

  return response.members[0]
}

/**
 * Get current members by chamber
 */
export async function getMembersByChamber(
  chamber: 'house' | 'senate',
  options: FetchOptions = {}
): Promise<CongressApiResponse<Member>> {
  const { limit = 250, offset = 0 } = options

  return fetchCongressApi<Member>(`/member/${chamber.toLowerCase()}`, {
    limit,
    offset,
    currentMember: 'true',
  })
}

/**
 * Get sponsored legislation for a member
 */
export async function getMemberSponsoredLegislation(
  bioguideId: string,
  options: FetchOptions = {}
): Promise<CongressApiResponse<Bill>> {
  const { limit = 20, offset = 0 } = options

  return fetchCongressApi<Bill>(`/member/${bioguideId}/sponsored-legislation`, {
    limit,
    offset,
  })
}

/**
 * Get member cosponsored legislation
 */
export async function getMemberCosponsoredLegislation(
  bioguideId: string,
  options: FetchOptions = {}
): Promise<CongressApiResponse<Bill>> {
  const { limit = 20, offset = 0 } = options

  return fetchCongressApi<Bill>(
    `/member/${bioguideId}/cosponsored-legislation`,
    { limit, offset }
  )
}

/**
 * Get amendment details
 */
export async function getAmendment(
  amendmentType: string,
  amendmentNumber: string,
  congress: number = CURRENT_CONGRESS
): Promise<Amendment> {
  const response = await fetchCongressApi<Amendment>(
    `/amendment/${congress}/${amendmentType.toLowerCase()}/${amendmentNumber}`
  )

  if (!response.amendments || response.amendments.length === 0) {
    throw new CongressApiError(
      `Amendment ${amendmentType} ${amendmentNumber} not found`,
      404
    )
  }

  return response.amendments[0]
}

/**
 * Get current congress number
 */
export function getCurrentCongress(): number {
  return CURRENT_CONGRESS
}

/**
 * Calculate congress number from year
 */
export function getCongressFromYear(year: number): number {
  return Math.floor((year - 1789) / 2) + 1
}

export { CongressApiError }
