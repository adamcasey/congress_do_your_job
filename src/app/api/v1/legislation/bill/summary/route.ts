import { NextRequest } from 'next/server'
import { getOrFetch, buildCacheKey, CacheTTL } from '@/lib/cache'
import { getOrCreateBillSummary } from '@/services/bill-summary'
import { createLogger } from '@/lib/logger'
import { jsonError, jsonSuccess } from '@/lib/api-response'

const logger = createLogger('BillSummaryAPI')

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const billType = searchParams.get('type')
    const billNumber = searchParams.get('number')
    const congress = Number(searchParams.get('congress')) || 119

    if (!billType || !billNumber) {
      return jsonError('Bill type and number are required', 400)
    }

    const cacheKey = buildCacheKey(
      'congress',
      'bill-summary',
      `${congress}-${billType}-${billNumber}`
    )
    
    const cached = await getOrFetch(
      cacheKey,
      () => getOrCreateBillSummary(billType, billNumber, congress),
      CacheTTL.LEGISLATIVE_DATA
    )

    if (!cached.data) {
      return jsonError('Failed to fetch bill summary', 500)
    }

    return jsonSuccess(cached.data, {
      headers: {
        'X-Cache-Status': cached.status,
        'X-Cache-Stale': cached.isStale ? 'true' : 'false',
        ...(cached.age !== undefined && { 'X-Cache-Age': cached.age.toString() }),
      },
    })
  } catch (error) {
    logger.error('Bill summary API error:', error)

    return jsonError('Failed to fetch bill summary', 500)
  }
}
