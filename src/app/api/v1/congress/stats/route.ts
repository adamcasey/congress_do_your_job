import { NextRequest } from 'next/server'
import { getBills, CongressApiError } from '@/lib/congress-api'
import { getOrFetch, buildCacheKey, CacheTTL } from '@/lib/cache'
import { createLogger } from '@/lib/logger'
import { jsonError, jsonSuccess } from '@/lib/api-response'
import type { CongressStatsResponse } from '@/types/legislation'

const logger = createLogger('CongressStatsAPI')

/**
 * Congress productivity stats endpoint
 * Computes bill advancement counts for the current and previous 7-day windows.
 *
 * GET /api/v1/congress/stats
 * Response: CongressStatsResponse
 */

function buildWeekLabel(from: Date, to: Date): string {
  const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
  return `${fmt.format(from)} – ${fmt.format(to)}, ${to.getFullYear()}`
}

function isoSeconds(d: Date): string {
  return d.toISOString().split('.')[0] + 'Z'
}

async function fetchBillCount(fromDate: Date, toDate: Date): Promise<number> {
  // limit=1 minimises data transfer; we only need pagination.count
  const response = await getBills({
    limit: 1,
    fromDateTime: isoSeconds(fromDate),
    toDateTime: isoSeconds(toDate),
    sort: 'updateDate+desc',
  })
  return response.pagination?.count ?? response.bills?.length ?? 0
}

export async function GET(_request: NextRequest) {
  try {
    const now = new Date()
    const thisWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const lastWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const cacheKey = buildCacheKey(
      'congress',
      'stats',
      now.toISOString().split('T')[0]
    )

    const fetcher = async (): Promise<CongressStatsResponse> => {
      const [thisWeekCount, lastWeekCount] = await Promise.all([
        fetchBillCount(thisWeekStart, now),
        fetchBillCount(lastWeekStart, thisWeekStart),
      ])

      const billsChange = thisWeekCount - lastWeekCount
      const billsChangeTone: CongressStatsResponse['billsChangeTone'] =
        billsChange > 0 ? 'good' : billsChange < 0 ? 'caution' : 'neutral'

      return {
        billsAdvancedThisWeek: thisWeekCount,
        billsAdvancedLastWeek: lastWeekCount,
        billsChange,
        billsChangeTone,
        weekLabel: buildWeekLabel(thisWeekStart, now),
        lastUpdated: now.toISOString(),
      }
    }

    const cached = await getOrFetch<CongressStatsResponse>(
      cacheKey,
      fetcher,
      CacheTTL.LEGISLATIVE_DATA
    )

    if (!cached.data) {
      return jsonError('Failed to compute congress stats', 500)
    }

    return jsonSuccess(cached.data, {
      headers: {
        'X-Cache-Status': cached.status,
        'X-Cache-Stale': cached.isStale ? 'true' : 'false',
        ...(cached.age !== undefined && { 'X-Cache-Age': cached.age.toString() }),
      },
    })
  } catch (error) {
    logger.error('Congress stats API error:', error)

    if (error instanceof CongressApiError) {
      return jsonError(error.message, error.statusCode || 500, {
        statusCode: error.statusCode,
      })
    }

    return jsonError('Failed to compute congress stats', 500)
  }
}
