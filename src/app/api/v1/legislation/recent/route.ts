import { NextRequest } from 'next/server'
import { getBills, CongressApiError } from '@/lib/congress-api'
import { getOrFetch, buildCacheKey, CacheTTL } from '@/lib/cache'
import { Bill } from '@/types/congress'
import { createLogger } from '@/lib/logger'
import { jsonError, jsonSuccess } from '@/lib/api-response'

const logger = createLogger('RecentBillsAPI')

/**
 * Recent legislation API endpoint
 * Returns recent congressional activity with caching
 *
 * Query params:
 * - limit: number of results (default: 20, max: 250)
 * - days: look back N days (default: 7)
 */

interface RecentBillsResponse {
  bills: Bill[]
  count: number
  lastUpdated: string
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 250)
    const days = Number(searchParams.get('days')) || 7

    const toDate = new Date()
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - days)

    const fromDateTime = fromDate.toISOString().split('.')[0] + 'Z'
    const toDateTime = toDate.toISOString().split('.')[0] + 'Z'

    // Build cache key based on parameters
    const cacheKey = buildCacheKey(
      'congress',
      'recent-bills',
      `${limit}-${days}-${toDate.toISOString().split('T')[0]}`
    )

    // Fetcher function for cache miss
    const fetchRecentBills = async (): Promise<RecentBillsResponse> => {
      const response = await getBills({
        limit,
        fromDateTime,
        toDateTime,
        sort: 'updateDate+desc',
      })

      if (!response.bills || response.bills.length === 0) {
        return {
          bills: [],
          count: 0,
          lastUpdated: toDateTime,
        }
      }

      return {
        bills: response.bills,
        count: response.pagination?.count || response.bills.length,
        lastUpdated: toDateTime,
      }
    }

    // Get from cache or fetch fresh data
    const cached = await getOrFetch<RecentBillsResponse>(
      cacheKey,
      fetchRecentBills,
      CacheTTL.LEGISLATIVE_DATA
    )

    if (!cached.data) {
      return jsonError('Failed to fetch recent bills', 500)
    }

    // Return data with cache status headers
    return jsonSuccess(cached.data, {
      headers: {
        'X-Cache-Status': cached.status,
        'X-Cache-Stale': cached.isStale ? 'true' : 'false',
        ...(cached.age !== undefined && { 'X-Cache-Age': cached.age.toString() }),
      },
    })
  } catch (error) {
    logger.error('Recent bills API error:', error)

    if (error instanceof CongressApiError) {
      return jsonError(error.message, error.statusCode || 500, {
        statusCode: error.statusCode,
      })
    }

    return jsonError('Failed to fetch recent bills', 500)
  }
}
