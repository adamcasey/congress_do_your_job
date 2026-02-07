import { NextRequest, NextResponse } from 'next/server'
import { prismaClient } from '@/lib/db'
import { getBills } from '@/lib/congress-api'
import { getOrCreateBillSummary } from '@/services/bill-summary'
import { createLogger } from '@/lib/logger'

const logger = createLogger('SummarizeBillsCron')

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stats = {
    processed: 0,
    created: 0,
    skipped: 0,
    errors: 0,
  }

  try {
    const toDate = new Date()
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const fromDateTime = threeMonthsAgo.toISOString().split('.')[0] + 'Z'
    const toDateTime = toDate.toISOString().split('.')[0] + 'Z'

    const response = await getBills({
      limit: 100,
      fromDateTime,
      toDateTime,
      sort: 'updateDate+desc',
    })

    if (!response.bills || response.bills.length === 0) {
      return NextResponse.json({
        message: 'No new bills found',
        stats,
      })
    }

    for (const bill of response.bills) {
      stats.processed++

      const introducedDate = bill.introducedDate ? new Date(bill.introducedDate) : null

      if (!introducedDate || introducedDate < threeMonthsAgo) {
        stats.skipped++
        continue
      }

      try {
        const existing = await prismaClient.billSummary.findUnique({
          where: {
            billType_billNumber_congress: {
              billType: bill.type,
              billNumber: bill.number,
              congress: bill.congress,
            },
          },
        })

        if (existing) {
          stats.skipped++
          continue
        }

        await getOrCreateBillSummary(bill.type, bill.number, bill.congress)
        stats.created++
      } catch (error) {
        logger.error(`Failed to generate summary for ${bill.type} ${bill.number}:`, error)
        stats.errors++
      }
    }

    return NextResponse.json({
      message: 'Bill summaries processed',
      stats,
    })
  } catch (error) {
    logger.error('Cron job error:', error)

    return NextResponse.json(
      {
        error: 'Failed to process bill summaries',
        stats,
      },
      { status: 500 }
    )
  }
}
