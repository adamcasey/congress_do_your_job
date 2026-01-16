import { NextRequest, NextResponse } from 'next/server'
import { RepresentativeResponse } from '@/types/representative'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const address = searchParams.get('address')

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.FIVE_CALLS_API_KEY
    const apiUrl = process.env.FIVE_CALLS_API_URL

    if (!apiKey) {
      console.error('5 Calls API key not configured')
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      )
    }

    if (!apiUrl) {
      console.error('5 Calls API URL not configured')
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      )
    }

    // Call 5 Calls API
    const url = new URL(apiUrl)
    url.searchParams.set('location', address)
    url.searchParams.set('areas', 'US House,US Senate') // Federal level only for MVP

    const response = await fetch(url.toString(), {
      headers: {
        'X-5Calls-Token': apiKey,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('5 Calls API error:', response.status, errorText)

      if (response.status === 404) {
        return NextResponse.json(
          { error: 'No representatives found for this address. Please check the address and try again.' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to fetch representatives' },
        { status: response.status }
      )
    }

    const data: RepresentativeResponse = await response.json()

    return NextResponse.json({
      location: data.location,
      state: data.state,
      district: data.district,
      representatives: data.representatives,
    })

  } catch (error) {
    console.error('Representatives API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch representatives. Please try again.' },
      { status: 500 }
    )
  }
}
