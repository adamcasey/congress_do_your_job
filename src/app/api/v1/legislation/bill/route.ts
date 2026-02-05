import { NextRequest, NextResponse } from 'next/server'
import { getBill, CongressApiError, getCurrentCongress } from '@/lib/congress-api'
import { getOrFetch, buildCacheKey, CacheTTL } from '@/lib/cache'
import { Bill } from '@/types/congress'

/**
 * Bill details API endpoint
 * Returns detailed information about a specific bill
 *
 * Query params:
 * - type: bill type (HR, S, HJRES, etc.)
 * - number: bill number
 * - congress: congress number (optional, defaults to current)
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const billType = searchParams.get('type')
    const billNumber = searchParams.get('number')
    const congress = Number(searchParams.get('congress')) || getCurrentCongress()

    if (!billType || !billNumber) {
      return NextResponse.json(
        { error: 'Bill type and number parameters are required' },
        { status: 400 }
      )
    }

    const cacheKey = buildCacheKey('congress', 'bill', `${congress}-${billType}-${billNumber}`)

    const fetchBillDetails = async (): Promise<Bill> => {
      return await getBill(billType, billNumber, congress)
    }

    const cached = await getOrFetch<Bill>(
      cacheKey,
      fetchBillDetails,
      CacheTTL.LEGISLATIVE_DATA
    )

    if (!cached.data) {
      return NextResponse.json(
        { error: 'Failed to fetch bill details' },
        { status: 500 }
      )
    }

    return NextResponse.json(cached.data, {
      headers: {
        'X-Cache-Status': cached.status,
        'X-Cache-Stale': cached.isStale ? 'true' : 'false',
        ...(cached.age !== undefined && { 'X-Cache-Age': cached.age.toString() }),
      },
    })
  } catch (error) {
    console.error('Bill details API error:', error)

    if (error instanceof CongressApiError) {
      return NextResponse.json(
        {
          error: error.message,
          statusCode: error.statusCode,
        },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch bill details' },
      { status: 500 }
    )
  }
}
