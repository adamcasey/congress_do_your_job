import { NextRequest, NextResponse } from 'next/server'
import { getNextHouseElection, formatElectionDate } from '@/lib/elections'
import { stateAbbrToFips } from '@/lib/states'
import { getOrFetch, buildCacheKey, CacheTTL } from '@/lib/cache'
import { createLogger } from '@/lib/logger'
import { jsonError, jsonSuccess } from '@/lib/api-response'

const logger = createLogger('DistrictAPI')

/**
 * District data API endpoint
 * Returns population, median age, and next election date for a congressional district
 *
 * Accepts either state FIPS codes or abbreviations:
 * - /api/v1/district?state=29&district=02 (FIPS code)
 * - /api/v1/district?state=MO&district=02 (abbreviation)
 */

interface DistrictData {
  state: string
  district: string
  districtName: string
  population: number | null
  medianAge: number | null
  nextElection: string | null
  error?: string
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const stateParam = searchParams.get('state')
    const district = searchParams.get('district')

    if (!stateParam || !district) {
      return jsonError('State and district parameters are required', 400)
    }

    // Convert state abbreviation to FIPS code if needed
    let stateFips = stateParam
    if (stateParam.length === 2 && isNaN(Number(stateParam))) {
      const converted = stateAbbrToFips(stateParam)
      if (!converted) {
        return NextResponse.json(
          { error: `Invalid state: ${stateParam}` },
          { status: 400 }
        )
      }
      stateFips = converted
    }

    const formattedDistrict = district.padStart(2, '0')

    // Build cache key
    const cacheKey = buildCacheKey('census', 'district', `${stateFips}-${formattedDistrict}`)

    const isAtLarge = formattedDistrict === '00' || formattedDistrict === '01'

    // Fetcher function for cache miss
    const fetchDistrictData = async (): Promise<DistrictData> => {
      const year = '2022'
      const censusApiKey = process.env.CENSUS_API_KEY
      const variables = 'NAME,B01003_001E,B01002_001E'

      const censusUrl = new URL(`https://api.census.gov/data/${year}/acs/acs5`)
      censusUrl.searchParams.set('get', variables)
      censusUrl.searchParams.set('for', `congressional district:${formattedDistrict}`)
      censusUrl.searchParams.set('in', `state:${stateFips}`)

      if (censusApiKey) {
        censusUrl.searchParams.set('key', censusApiKey)
      }

      const censusResponse = await fetch(censusUrl.toString(), {
        headers: { 'Accept': 'application/json' },
      })

      if (!censusResponse.ok) {
        const errorText = await censusResponse.text()
        logger.error('Census API error:', censusResponse.status, errorText, 'URL:', censusUrl.toString())
        throw new Error('District not found or no data available')
      }

      const responseText = await censusResponse.text()

      if (!responseText || responseText.trim().length === 0) {
        logger.error('Census API returned empty response, URL:', censusUrl.toString())
        throw new Error('District not found or no data available')
      }

      let censusData: unknown
      try {
        censusData = JSON.parse(responseText)
      } catch (parseError) {
        logger.error('Census API JSON parse error:', parseError, 'Response:', responseText.substring(0, 200))
        throw new Error('Invalid JSON response from Census API')
      }

      if (!Array.isArray(censusData) || censusData.length < 2) {
        throw new Error('Invalid district data')
      }

      const headers = censusData[0]
      const values = censusData[1]

      const nameIndex = headers.indexOf('NAME')
      const populationIndex = headers.indexOf('B01003_001E')
      const medianAgeIndex = headers.indexOf('B01002_001E')

      const districtName = values[nameIndex] || `District ${formattedDistrict}`
      const population = values[populationIndex] ? parseInt(values[populationIndex], 10) : null
      const medianAge = values[medianAgeIndex] ? parseFloat(values[medianAgeIndex]) : null

      const nextElectionDate = getNextHouseElection()
      const nextElection = formatElectionDate(nextElectionDate)

      return {
        state: stateFips,
        district: formattedDistrict,
        districtName: isAtLarge && districtName.includes('At-Large') ? 'At-Large District' : districtName,
        population,
        medianAge,
        nextElection,
      }
    }

    // Get from cache or fetch fresh data
    const cached = await getOrFetch<DistrictData>(
      cacheKey,
      fetchDistrictData,
      CacheTTL.DISTRICT_DATA
    )

    if (!cached.data) {
      return jsonError('Failed to fetch district data', 500)
    }

    // Return data with cache status headers
    return jsonSuccess(cached.data, {
      headers: {
        'X-Cache-Status': cached.status,
        'X-Cache-Stale': cached.isStale ? 'true' : 'false',
        ...(cached.age !== undefined && { 'X-Cache-Age': cached.age.toString() }),
      },
    })

  } catch (error) {
    logger.error('District API error:', error)
    return jsonError('Failed to fetch district data', 500)
  }
}
