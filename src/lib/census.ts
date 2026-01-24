/**
 * Census Bureau API client utilities
 *
 * Provides a robust, reusable interface for fetching data from the Census Bureau API
 * with proper error handling, JSON parsing, and type safety.
 *
 * Census API Documentation: https://www.census.gov/data/developers/data-sets.html
 */

export interface CensusApiConfig {
  /** Base year for the dataset (e.g., '2022') */
  year: string
  /** Dataset name (e.g., 'acs/acs5' for American Community Survey 5-Year Estimates) */
  dataset: string
  /** Comma-separated list of variable codes to fetch */
  variables: string
  /** Geographic level to query (e.g., 'congressional district:02') */
  geographyFor: string
  /** Parent geography constraint (e.g., 'state:29') */
  geographyIn?: string
  /** Optional API key (Census API works without key for limited requests) */
  apiKey?: string
}

export class CensusApiException extends Error {
  constructor(
    public readonly status: number,
    public readonly errorText: string,
    message: string = 'Census API request failed'
  ) {
    super(message)
    this.name = 'CensusApiException'
  }
}

/**
 * Fetches data from the Census Bureau API with robust error handling
 *
 * @template T The expected return type for the parsed data
 * @param config Census API configuration
 * @returns Parsed response data
 * @throws CensusApiException on any error (network, parsing, invalid response)
 *
 * @example
 * const data = await fetchCensusData<string[][]>({
 *   year: '2022',
 *   dataset: 'acs/acs5',
 *   variables: 'NAME,B01003_001E',
 *   geographyFor: 'congressional district:02',
 *   geographyIn: 'state:29',
 *   apiKey: process.env.CENSUS_API_KEY,
 * })
 */
export async function fetchCensusData<T>(config: CensusApiConfig): Promise<T> {
  const { year, dataset, variables, geographyFor, geographyIn, apiKey } = config

  // Build Census API URL
  const url = new URL(`https://api.census.gov/data/${year}/${dataset}`)
  url.searchParams.set('get', variables)
  url.searchParams.set('for', geographyFor)

  if (geographyIn) {
    url.searchParams.set('in', geographyIn)
  }

  if (apiKey) {
    url.searchParams.set('key', apiKey)
  }

  // Fetch from Census API
  let response: Response
  try {
    response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    })
  } catch (networkError) {
    const errorMsg = networkError instanceof Error ? networkError.message : 'Network error'
    console.error('Census API network error:', errorMsg, 'URL:', url.toString())
    throw new CensusApiException(503, errorMsg, 'Failed to connect to Census API')
  }

  // Handle non-200 responses
  if (!response.ok) {
    const errorText = await response.text()
    console.error(
      'Census API error:',
      response.status,
      errorText,
      'URL:',
      url.toString()
    )
    throw new CensusApiException(response.status, errorText)
  }

  // Parse response text
  let responseText: string
  try {
    responseText = await response.text()
  } catch (readError) {
    const errorMsg = readError instanceof Error ? readError.message : 'Read error'
    console.error('Census API read error:', errorMsg, 'URL:', url.toString())
    throw new CensusApiException(500, errorMsg, 'Failed to read Census API response')
  }

  // Handle empty responses
  if (!responseText || responseText.trim().length === 0) {
    console.error('Census API returned empty response, URL:', url.toString())
    throw new CensusApiException(404, 'Empty response body')
  }

  // Parse JSON
  try {
    return JSON.parse(responseText) as T
  } catch (parseError) {
    const errorMsg = parseError instanceof Error ? parseError.message : 'JSON parse error'
    console.error(
      'Census API JSON parse error:',
      errorMsg,
      'Response:',
      responseText.substring(0, 200),
      'URL:',
      url.toString()
    )
    throw new CensusApiException(500, errorMsg, 'Invalid JSON response from Census API')
  }
}

/**
 * Validates that Census API response is in the expected array format
 *
 * Census API returns data as:
 * [
 *   ["NAME", "B01003_001E", "state", "congressional district"],
 *   ["Congressional District 2, Missouri", "766987", "29", "02"]
 * ]
 */
export function isCensusArrayResponse(data: unknown): data is string[][] {
  return (
    Array.isArray(data) &&
    data.length >= 2 &&
    Array.isArray(data[0]) &&
    Array.isArray(data[1])
  )
}

/**
 * Extracts a value from Census API array response by column name
 */
export function extractCensusValue(
  data: string[][],
  columnName: string
): string | null {
  if (!isCensusArrayResponse(data)) {
    return null
  }

  const headers = data[0]
  const values = data[1]
  const index = headers.indexOf(columnName)

  return index !== -1 ? values[index] : null
}

/**
 * Parses a Census API numeric value (population, age, etc.)
 */
export function parseCensusNumber(value: string | null): number | null {
  if (!value) return null
  const parsed = parseFloat(value)
  return isNaN(parsed) ? null : parsed
}
