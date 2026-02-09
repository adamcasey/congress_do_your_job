import { NextRequest } from 'next/server'
import { createLogger } from '@/lib/logger'
import { jsonError, jsonSuccess } from '@/lib/api-response'

const logger = createLogger('CensusTest')

/**
 * Test endpoint for Census Bureau Population API
 *
 * Census API Documentation:
 * - Base URL: https://api.census.gov/data
 * - Dataset: American Community Survey (ACS) 5-Year Estimates
 * - Variables:
 *   - B01003_001E: Total Population
 *   - B01002_001E: Median Age
 *
 * Example usage:
 * /api/test/census-population?state=29&district=02
 *
 * Note: Census API allows limited requests without API key
 */

interface CensusResponse {
  state: string
  district: string
  population: number | null
  medianAge: number | null
  rawData?: unknown
  error?: string
  hint?: string
  details?: string
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const state = searchParams.get('state') || '29' // Default: Missouri
    const district = searchParams.get('district') || '02' // Default: District 2

    // Format district with leading zero if needed
    const formattedDistrict = district.padStart(2, '0')

    // Census API endpoint for ACS 5-Year Estimates (most recent complete dataset)
    // Using 2022 data (latest available as of 2024)
    const year = '2022'
    const censusApiKey = process.env.CENSUS_API_KEY // Optional - works without key for limited requests

    // Variables we're requesting:
    // NAME: Geographic area name
    // B01003_001E: Total Population
    // B01002_001E: Median Age
    const variables = 'NAME,B01003_001E,B01002_001E'

    // Build URL
    const url = new URL(`https://api.census.gov/data/${year}/acs/acs5`)
    url.searchParams.set('get', variables)
    url.searchParams.set('for', `congressional district:${formattedDistrict}`)
    url.searchParams.set('in', `state:${state}`)

    if (censusApiKey) {
      url.searchParams.set('key', censusApiKey)
    }

    logger.info('🔍 Testing Census API:', url.toString())

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('Census API error:', response.status, errorText)

      return jsonError(
        `Census API returned ${response.status}: ${errorText}`,
        response.status,
        {
          state,
          district: formattedDistrict,
          population: null,
          medianAge: null,
          hint: response.status === 400
            ? 'Invalid state or district code. Use FIPS codes (e.g., state=29 for Missouri, district=02 for 2nd district)'
            : 'Check Census API status at https://api.census.gov/data.html',
        }
      )
    }

    const data = await response.json()

    // Census API returns data as array of arrays:
    // [
    //   ["NAME", "B01003_001E", "B01002_001E", "state", "congressional district"],
    //   ["Congressional District 2, Missouri", "766987", "38.2", "29", "02"]
    // ]

    logger.info('✅ Census API Response:', JSON.stringify(data, null, 2))

    if (!Array.isArray(data) || data.length < 2) {
      return jsonError('Unexpected response format from Census API', 500, {
        state,
        district: formattedDistrict,
        population: null,
        medianAge: null,
        rawData: data,
      })
    }

    const headers = data[0]
    const values = data[1]

    // Parse values
    const nameIndex = headers.indexOf('NAME')
    const populationIndex = headers.indexOf('B01003_001E')
    const medianAgeIndex = headers.indexOf('B01002_001E')

    const districtName = values[nameIndex]
    const population = values[populationIndex] ? parseInt(values[populationIndex], 10) : null
    const medianAge = values[medianAgeIndex] ? parseFloat(values[medianAgeIndex]) : null

    const result: CensusResponse = {
      state,
      district: formattedDistrict,
      population,
      medianAge,
      rawData: {
        districtName,
        year: parseInt(year),
        source: 'American Community Survey 5-Year Estimates',
        fullResponse: data,
      },
    }

    return jsonSuccess(result)

  } catch (error) {
    logger.error('Census API test error:', error)
    return jsonError(
      'Failed to fetch Census data',
      500,
      error instanceof Error ? error.message : 'Unknown error'
    )
  }
}
