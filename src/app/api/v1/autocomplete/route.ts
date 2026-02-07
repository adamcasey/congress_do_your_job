import { NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/logger'

const logger = createLogger('AutocompleteAPI')

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const input = searchParams.get('input')

    if (!input || input.length < 3) {
      return NextResponse.json({ predictions: [] })
    }

    const apiKey = process.env.GOOGLE_API_KEY
    const apiUrl = process.env.GOOGLE_PLACES_API_URL

    if (!apiKey) {
      logger.error('Google API key not configured')
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      )
    }

    if (!apiUrl) {
      logger.error('Google Places API URL not configured')
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      )
    }

    // Use new Places API (New) format
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey.replace(/"/g, ''), // Remove quotes if present
      },
      body: JSON.stringify({
        input,
        includedRegionCodes: ['us'],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('Google Places API error:', response.status, errorText)
      return NextResponse.json({ predictions: [] })
    }

    const data = await response.json()

    // Transform new API format to match our existing interface
    return NextResponse.json({
      predictions: data.suggestions?.map((suggestion: any) => ({
        description: suggestion.placePrediction?.text?.text || suggestion.queryPrediction?.text?.text || '',
        placeId: suggestion.placePrediction?.placeId || suggestion.queryPrediction?.text?.text || '',
      })).filter((p: any) => p.description) || [],
    })

  } catch (error) {
    logger.error('Autocomplete API error:', error)
    return NextResponse.json({ predictions: [] })
  }
}
