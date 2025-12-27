import { NextResponse } from 'next/server'
import { defaultDeadlines, defaultWeeklyBriefing } from '@/components/landing/data'

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      items: defaultWeeklyBriefing,
      deadlines: defaultDeadlines,
    },
  })
}
