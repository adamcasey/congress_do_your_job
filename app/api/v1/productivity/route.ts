import { NextResponse } from 'next/server'
import { defaultProductivityMetrics } from '@/components/landing/data'

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      metrics: defaultProductivityMetrics,
    },
  })
}
