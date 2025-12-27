import { NextResponse } from 'next/server'
import { defaultDeadlines, defaultWeeklyBriefing } from '@/components/landing/data'

const CONGRESS_BASE = 'https://api.congress.gov/v3'
const NYT_CONGRESS_BASE = 'https://api.nytimes.com/svc/politics/v3/us/legislative/congress'

type CongressBillResponse = {
  bills?: Array<{
    number?: string
    title?: string
    latestAction?: { actionDate?: string; text?: string }
    originChamber?: string
    congress?: number
  }>
}

type NytVotesResponse = {
  results?: Array<{
    votes?: Array<{
      bill?: { title?: string }
      result?: string
      date?: string
      description?: string
    }>
  }>
}

function mapStatus(text?: string) {
  if (!text) return 'update'
  const lower = text.toLowerCase()
  if (lower.includes('passed')) return 'passed'
  if (lower.includes('agreed') || lower.includes('approved')) return 'advanced'
  if (lower.includes('introduced')) return 'update'
  if (lower.includes('committee')) return 'advanced'
  return 'update'
}

export async function GET() {
  const congressKey = process.env.CONGRESS_GOV_API_KEY
  const nytKey = process.env.NYT_API_KEY

  let items = defaultWeeklyBriefing
  let deadlines = defaultDeadlines

  try {
    if (congressKey) {
      const res = await fetch(`${CONGRESS_BASE}/bill?api_key=${congressKey}&format=json&limit=6`, {
        next: { revalidate: 600 },
      })
      if (res.ok) {
        const json = (await res.json()) as CongressBillResponse
        if (json?.bills?.length) {
          items = json.bills.slice(0, 4).map((bill) => {
            const statusText = bill.latestAction?.text || ''
            return {
              title: bill.title || `Bill ${bill.number}`,
              summary:
                bill.latestAction?.text ||
                `Latest action${bill.latestAction?.actionDate ? ` on ${bill.latestAction.actionDate}` : ''}`,
              status: mapStatus(statusText),
              detail: bill.originChamber
                ? `Origin: ${bill.originChamber}${bill.congress ? ` • ${bill.congress}th Congress` : ''}`
                : 'Latest action pulled from Congress.gov',
            }
          })
        }
      }
    }

    if (nytKey) {
      const res = await fetch(`${NYT_CONGRESS_BASE}/senate/votes/recent.json?api-key=${nytKey}`, {
        next: { revalidate: 600 },
      })
      if (res.ok) {
        const json = (await res.json()) as NytVotesResponse
        const recentVote = json?.results?.[0]?.votes?.[0]
        if (recentVote) {
          items = [
            {
              title: recentVote.bill?.title || recentVote.description || 'Recent floor vote',
              summary: recentVote.description || 'Recent Senate floor vote',
              status: mapStatus(recentVote.result),
              detail: recentVote.date ? `Vote date: ${recentVote.date}` : 'Pulled from NYT Congress API',
            },
            ...items.slice(0, 3),
          ]
        }
      }
    }
  } catch (error) {
    console.error('Briefing API error:', error)
  }

  return NextResponse.json({
    success: true,
    data: {
      items,
      deadlines,
    },
  })
}
