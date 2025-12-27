import { NextResponse } from 'next/server'
import { defaultChoreList } from '@/components/landing/data'

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      chores: defaultChoreList,
    },
  })
}
