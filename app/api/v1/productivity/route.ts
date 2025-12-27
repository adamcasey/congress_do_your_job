import { NextResponse } from 'next/server'
import { defaultProductivityMetrics } from '@/components/landing/data'

const CONGRESS_BASE = 'https://api.congress.gov/v3'
const NYT_CONGRESS_BASE = 'https://api.nytimes.com/svc/politics/v3/us/legislative/congress'

type CongressBillResponse = {
  bills?: Array<{
    latestAction?: { actionDate?: string; text?: string }
  }>
}

type NytVotesResponse = {
  results?: Array<{
    votes?: Array<{
      date?: string
    }>
  }>
}

export async function GET() {
  const congressKey = process.env.CONGRESS_GOV_API_KEY
  const nytKey = process.env.NYT_API_KEY

  let metrics = defaultProductivityMetrics

  try {
    const billPromise = congressKey
      ? fetch(`${CONGRESS_BASE}/bill?api_key=${congressKey}&format=json&limit=50`, {
          next: { revalidate: 900 },
        }).then(async (res) => (res.ok ? ((await res.json()) as CongressBillResponse) : null))
      : Promise.resolve(null)

    const votesPromise = nytKey
      ? fetch(`${NYT_CONGRESS_BASE}/house/votes/recent.json?api-key=${nytKey}`, {
          next: { revalidate: 900 },
        }).then(async (res) => (res.ok ? ((await res.json()) as NytVotesResponse) : null))
      : Promise.resolve(null)

    const [billsData, votesData] = await Promise.all([billPromise, votesPromise])

    const billCount = billsData?.bills?.length ?? 0
    const voteCount = votesData?.results?.[0]?.votes?.length ?? 0
    const recentActions = billsData?.bills?.filter((bill) => {
      if (!bill.latestAction?.actionDate) return false
      const actionDate = new Date(bill.latestAction.actionDate)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return actionDate >= weekAgo
    }).length

    if (billCount || voteCount) {
      metrics = [
        {
          label: 'Bills updated (7d)',
          value: String(recentActions ?? billCount),
          change: 'Live from Congress.gov',
          tone: 'good',
        },
        {
          label: 'Recent floor votes',
          value: String(voteCount),
          change: 'NYT Congress API',
          tone: voteCount > 0 ? 'good' : 'caution',
        },
        {
          label: 'Total bills fetched',
          value: String(billCount),
          change: 'Congress.gov feed',
          tone: 'neutral',
        },
        defaultProductivityMetrics[4],
        defaultProductivityMetrics[5],
      ]
    }
  } catch (error) {
    console.error('Productivity API error:', error)
  }

  return NextResponse.json({
    success: true,
    data: {
      metrics,
    },
  })
}
