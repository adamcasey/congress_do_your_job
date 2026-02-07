import { prismaClient } from '@/lib/db'
import { getBill } from '@/lib/congress-api'
import { summarizeBill } from '@/lib/gemini-api'
import { createLogger } from '@/lib/logger'

const logger = createLogger('BillSummary')

export interface BillSummaryResult {
  summary: string
  source: 'database' | 'generated' | 'fallback'
  generatedAt: Date
}

export async function getOrCreateBillSummary(
  billType: string,
  billNumber: string,
  congress: number
): Promise<BillSummaryResult> {
  const existingSummary = await prismaClient.billSummary.findUnique({
    where: {
      billType_billNumber_congress: {
        billType: billType.toUpperCase(),
        billNumber,
        congress,
      },
    },
  })

  if (existingSummary) {
    return {
      summary: existingSummary.summary,
      source: 'database',
      generatedAt: existingSummary.generatedAt,
    }
  }

  const bill = await getBill(billType, billNumber, congress)

  let billText = ''
  // TODO: debug why some bills don't have summaries and what to do as a default
  if (bill.summaries && bill.summaries.length > 0) {
    billText = bill.summaries[0].text
  } else if (bill.title) {
    billText = bill.title
  } else {
    return {
      summary: 'Summary not available.',
      source: 'fallback',
      generatedAt: new Date(),
    }
  }

  try {
    const aiSummary = await summarizeBill({
      billText,
      billTitle: bill.title,
      maxLength: 300,
    })

    await prismaClient.billSummary.create({
      data: {
        billType: billType.toUpperCase(),
        billNumber,
        congress,
        summary: aiSummary,
        model: 'gemini-2.0-flash-exp',
        title: bill.title,
        introducedDate: bill.introducedDate ? new Date(bill.introducedDate) : null,
        sponsors: bill.sponsors ? JSON.parse(JSON.stringify(bill.sponsors)) : null,
        fullTextUrl: bill.url,
      },
    })

    return {
      summary: aiSummary,
      source: 'generated',
      generatedAt: new Date(),
    }
  } catch (error) {
    logger.error('Failed to generate AI summary:', error)

    if (bill.summaries && bill.summaries.length > 0) {
      const rawText = bill.summaries[0].text.replace(/<[^>]*>/g, '')
      const sentences = rawText.match(/[^.!?]+[.!?]+/g) || []
      const fallbackSummary = sentences.slice(0, 2).join(' ').trim()

      return {
        summary: fallbackSummary || bill.title,
        source: 'fallback',
        generatedAt: new Date(),
      }
    }

    return {
      summary: bill.title,
      source: 'fallback',
      generatedAt: new Date(),
    }
  }
}
