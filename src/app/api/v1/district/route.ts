import { NextRequest, NextResponse } from 'next/server'
import { getNextHouseElection, formatElectionDate } from '@/lib/elections'
import { stateAbbrToFips } from '@/lib/states'

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
      return NextResponse.json(
        { error: 'State and district parameters are required' },
        { status: 400 }
      )
    }

    // Convert state abbreviation to FIPS code if needed
    let stateFips = stateParam
    if (stateParam.length === 2 && isNaN(Number(stateParam))) {
      // Looks like a state abbreviation (e.g., "MO")
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

    // Handle at-large districts (states with only 1 representative)
    // At-large districts are typically coded as "00" or "01" depending on source
    const isAtLarge = formattedDistrict === '00' || formattedDistrict === '01'

    // Fetch Census data
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
      console.error('Census API error:', censusResponse.status, errorText, 'URL:', censusUrl.toString())

      return NextResponse.json({
        state: stateFips,
        district: formattedDistrict,
        districtName: isAtLarge ? 'At-Large District' : `District ${formattedDistrict}`,
        population: null,
        medianAge: null,
        nextElection: null,
        error: 'District not found or no data available',
      } as DistrictData, { status: censusResponse.status })
    }

    // Parse JSON with error handling
    let responseText: string
    try {
      responseText = await censusResponse.text()
    } catch (readError) {
      console.error('Census API read error:', readError, 'URL:', censusUrl.toString())
      return NextResponse.json({
        state: stateFips,
        district: formattedDistrict,
        districtName: isAtLarge ? 'At-Large District' : `District ${formattedDistrict}`,
        population: null,
        medianAge: null,
        nextElection: null,
        error: 'Failed to read Census API response',
      } as DistrictData, { status: 500 })
    }

    if (!responseText || responseText.trim().length === 0) {
      console.error('Census API returned empty response, URL:', censusUrl.toString())
      return NextResponse.json({
        state: stateFips,
        district: formattedDistrict,
        districtName: isAtLarge ? 'At-Large District' : `District ${formattedDistrict}`,
        population: null,
        medianAge: null,
        nextElection: null,
        error: 'District not found or no data available',
      } as DistrictData, { status: 404 })
    }

    let censusData: unknown
    try {
      censusData = JSON.parse(responseText)
    } catch (parseError) {
      console.error('Census API JSON parse error:', parseError, 'Response:', responseText.substring(0, 200), 'URL:', censusUrl.toString())
      return NextResponse.json({
        state: stateFips,
        district: formattedDistrict,
        districtName: isAtLarge ? 'At-Large District' : `District ${formattedDistrict}`,
        population: null,
        medianAge: null,
        nextElection: null,
        error: 'Invalid JSON response from Census API',
      } as DistrictData, { status: 500 })
    }

    if (!Array.isArray(censusData) || censusData.length < 2) {
      return NextResponse.json({
        state: stateFips,
        district: formattedDistrict,
        districtName: isAtLarge ? 'At-Large District' : `District ${formattedDistrict}`,
        population: null,
        medianAge: null,
        nextElection: null,
        error: 'Invalid district data',
      } as DistrictData, { status: 404 })
    }

    const headers = censusData[0]
    const values = censusData[1]

    const nameIndex = headers.indexOf('NAME')
    const populationIndex = headers.indexOf('B01003_001E')
    const medianAgeIndex = headers.indexOf('B01002_001E')

    const districtName = values[nameIndex] || `District ${formattedDistrict}`
    const population = values[populationIndex] ? parseInt(values[populationIndex], 10) : null
    const medianAge = values[medianAgeIndex] ? parseFloat(values[medianAgeIndex]) : null

    // Calculate next election date (House elections are every 2 years)
    const nextElectionDate = getNextHouseElection()
    const nextElection = formatElectionDate(nextElectionDate)

    const result: DistrictData = {
      state: stateFips,
      district: formattedDistrict,
      districtName: isAtLarge && districtName.includes('At-Large') ? 'At-Large District' : districtName,
      population,
      medianAge,
      nextElection,
    }

    return NextResponse.json(result, { status: 200 })

  } catch (error) {
    console.error('District API error:', error)
    return NextResponse.json({
      error: 'Failed to fetch district data',
    }, { status: 500 })
  }
}
