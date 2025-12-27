import { NextResponse } from 'next/server'
import { defaultChoreList } from '@/components/landing/data'

const CONGRESS_BASE = 'https://api.congress.gov/v3'

type CongressBillResponse = {
  bills?: Array<{
    number?: string
    title?: string
    latestAction?: { actionDate?: string; text?: string }
    originChamber?: string
  }>
}

function isAppropriations(title?: string) {
  if (!title) return false
  const lower = title.toLowerCase()
  return lower.includes('appropriation') || lower.includes('appropriations') || lower.includes('budget')
}

export async function GET() {
  const congressKey = process.env.CONGRESS_GOV_API_KEY
  let chores = defaultChoreList

  try {
    if (congressKey) {
      const res = await fetch(`${CONGRESS_BASE}/bill?api_key=${congressKey}&format=json&limit=20`, {
        next: { revalidate: 1200 },
      })
      if (res.ok) {
        const json = (await res.json()) as CongressBillResponse
        const appropriationBills = (json?.bills ?? []).filter((bill) => isAppropriations(bill.title)).slice(0, 6)

        if (appropriationBills.length) {
          chores = appropriationBills.map((bill) => ({
            title: bill.title || `Bill ${bill.number}`,
            due: bill.latestAction?.actionDate ? `Last action: ${bill.latestAction.actionDate}` : 'Date pending',
            status: bill.latestAction?.text?.toLowerCase().includes('passed') ? 'advanced' : 'scheduled',
            impact: 'Annual funding — sourced from Congress.gov latest actions.',
            source: 'Congress.gov — Appropriations feed',
          }))
        }
      }
    }
  } catch (error) {
    console.error('Chores API error:', error)
  }

  return NextResponse.json({
    success: true,
    data: {
      chores,
    },
  })
}
