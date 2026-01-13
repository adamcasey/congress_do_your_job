import { NextRequest, NextResponse } from 'next/server'
import { RepresentativeResponse, RepresentativeWithOffice } from '@/types/representative'

const GOOGLE_CIVIC_API_URL = 'https://www.googleapis.com/civicinfo/v2/representatives'

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

    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
      console.error('Google API key not configured')
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      )
    }

    // Call Google Civic Information API
    const url = new URL(GOOGLE_CIVIC_API_URL)
    url.searchParams.set('address', address)
    url.searchParams.set('key', apiKey)
    url.searchParams.set('levels', 'country') // Federal level only for MVP
    url.searchParams.set('roles', 'legislatorUpperBody') // Senate
    url.searchParams.append('roles', 'legislatorLowerBody') // House

    const response = await fetch(url.toString())

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google Civic API error:', response.status, errorText)

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

    // Transform the response to flatten offices and officials
    const representatives: RepresentativeWithOffice[] = []

    if (data.offices && data.officials) {
      data.offices.forEach((office) => {
        office.officialIndices.forEach((index) => {
          const official = data.officials[index]
          if (official) {
            representatives.push({
              ...official,
              office: office.name,
              level: office.levels?.[0] || 'unknown',
              division: office.divisionId,
            })
          }
        })
      })
    }

    return NextResponse.json({
      address: data.normalizedInput,
      representatives,
    })

  } catch (error) {
    console.error('Representatives API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch representatives. Please try again.' },
      { status: 500 }
    )
  }
}
