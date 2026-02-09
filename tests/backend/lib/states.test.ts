import { describe, expect, it } from 'vitest'
import { fipsToStateAbbr, hasCongressionalDistricts, stateAbbrToFips } from '@/lib/states'

describe('state conversion helpers', () => {
  it('converts state abbreviation to FIPS', () => {
    expect(stateAbbrToFips('mo')).toBe('29')
    expect(stateAbbrToFips(' MO ')).toBe('29')
  })

  it('returns null for invalid abbreviations', () => {
    expect(stateAbbrToFips('XX')).toBeNull()
    expect(stateAbbrToFips('')).toBeNull()
  })

  it('converts FIPS to state abbreviation', () => {
    expect(fipsToStateAbbr('29')).toBe('MO')
  })

  it('returns null for invalid fips', () => {
    expect(fipsToStateAbbr('00')).toBeNull()
  })

  it('validates congressional district availability by state', () => {
    expect(hasCongressionalDistricts('mo')).toBe(true)
    expect(hasCongressionalDistricts('xx')).toBe(false)
  })
})
