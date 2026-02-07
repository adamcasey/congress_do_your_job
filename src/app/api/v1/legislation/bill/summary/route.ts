import { NextRequest, NextResponse } from 'next/server'
import { getOrFetch, buildCacheKey, CacheTTL } from '@/lib/cache'
import { getOrCreateBillSummary } from '@/services/bill-summary'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const billType = searchParams.get('type')
    const billNumber = searchParams.get('number')
    const congress = Number(searchParams.get('congress')) || 119

    if (!billType || !billNumber) {
      return NextResponse.json(
        { error: 'Bill type and number are required' },
        { status: 400 }
      )
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
      return NextResponse.json(
        { error: 'Failed to fetch bill summary' },
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
    console.error('Bill summary API error:', error)

    return NextResponse.json(
      { error: 'Failed to fetch bill summary' },
      { status: 500 }
    )
  }
}
