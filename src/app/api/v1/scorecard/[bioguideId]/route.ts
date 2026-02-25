import { NextRequest } from 'next/server'
import { collectScorecardData, CollectionResult, DataSourceReport } from '@/services/scorecard-data-collector'
import { calculateScorecard } from '@/services/scorecard-calculator'
import { CongressApiError } from '@/lib/congress-api'
import { getOrFetch, buildCacheKey, CacheTTL } from '@/lib/cache'
import { createLogger } from '@/lib/logger'
import { jsonError, jsonSuccess } from '@/lib/api-response'
import { CalculatedScorecard } from '@/types/scorecard'

const logger = createLogger('ScorecardAPI')

const BIOGUIDE_ID_PATTERN = /^[A-Z]\d{6}$/

interface ScorecardResponse {
  scorecard: CalculatedScorecard
  dataSources: DataSourceReport
}

/**
 * Scorecard API endpoint
 * Returns calculated scorecard for a member of Congress
 *
 * Path params:
 * - bioguideId: Member's Bioguide identifier (e.g., "S001191")
 *
 * Query params:
 * - period: Scoring period — "session" (default), "yearly", "quarterly"
 * - skipCache: Set to "true" to bypass cache (development only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bioguideId: string }> }
) {
  try {
    const { bioguideId } = await params

    if (!bioguideId || !BIOGUIDE_ID_PATTERN.test(bioguideId)) {
      return jsonError(
        'Invalid bioguideId. Expected format: one uppercase letter followed by six digits (e.g., S001191)',
        400
      )
    }

    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || 'session'
    const skipCache = searchParams.get('skipCache') === 'true'

    const validPeriods = ['session', 'yearly', 'quarterly']
    if (!validPeriods.includes(period)) {
      return jsonError(
        `Invalid period "${period}". Must be one of: ${validPeriods.join(', ')}`,
        400
      )
    }

    const { periodStart, periodEnd } = getPeriodDates(period)

    const cacheKey = buildCacheKey(
      'scorecard',
      'calculated',
      `${bioguideId}:${period}`
    )

    const fetcher = async (): Promise<ScorecardResponse> => {
      const collectionResult: CollectionResult = await collectScorecardData(
        bioguideId,
        periodStart,
        periodEnd
      )

      const scorecard = calculateScorecard(collectionResult.input)

      return {
        scorecard,
        dataSources: collectionResult.dataSources,
      }
    }

    let result
    if (skipCache) {
      const data = await fetcher()
      result = { data, status: 'MISS' as const, isStale: false }
    } else {
      result = await getOrFetch<ScorecardResponse>(
        cacheKey,
        fetcher,
        CacheTTL.SCORECARD
      )
    }

    if (!result.data) {
      return jsonError('Failed to calculate scorecard', 500)
    }

    return jsonSuccess(result.data, {
      headers: {
        'X-Cache-Status': result.status,
        'X-Cache-Stale': result.isStale ? 'true' : 'false',
        ...(result.age !== undefined && { 'X-Cache-Age': result.age.toString() }),
      },
    })
  } catch (error) {
    logger.error('Scorecard API error:', error)

    if (error instanceof CongressApiError) {
      const status = error.statusCode === 404 ? 404 : (error.statusCode || 500)
      const message = error.statusCode === 404
        ? 'Member not found in Congress.gov'
        : error.message

      return jsonError(message, status, {
        statusCode: error.statusCode,
      })
    }

    return jsonError('Failed to calculate scorecard', 500)
  }
}

/**
 * Calculate period start/end dates based on the requested period type.
 *
 * - session: Current congressional session (starts Jan 3 of odd year)
 * - yearly: Current calendar year
 * - quarterly: Current calendar quarter
 */
function getPeriodDates(period: string): { periodStart: Date; periodEnd: Date } {
  const now = new Date()
  const year = now.getFullYear()

  switch (period) {
    case 'session': {
      // Congressional sessions start Jan 3 of odd years and last 2 years
      const sessionStartYear = year % 2 === 1 ? year : year - 1
      return {
        periodStart: new Date(sessionStartYear, 0, 3),
        periodEnd: now,
      }
    }
    case 'yearly': {
      return {
        periodStart: new Date(year, 0, 1),
        periodEnd: now,
      }
    }
    case 'quarterly': {
      const quarterStart = Math.floor(now.getMonth() / 3) * 3
      return {
        periodStart: new Date(year, quarterStart, 1),
        periodEnd: now,
      }
    }
    default: {
      // Fallback to session
      const sessionStartYear = year % 2 === 1 ? year : year - 1
      return {
        periodStart: new Date(sessionStartYear, 0, 3),
        periodEnd: now,
      }
    }
  }
}
