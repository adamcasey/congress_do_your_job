/**
 * State utilities for FIPS code conversion and validation
 */

/**
 * Maps state abbreviations to FIPS codes
 */
export const STATE_ABBR_TO_FIPS: Record<string, string> = {
  AL: '01', // Alabama
  AK: '02', // Alaska
  AZ: '04', // Arizona
  AR: '05', // Arkansas
  CA: '06', // California
  CO: '08', // Colorado
  CT: '09', // Connecticut
  DE: '10', // Delaware
  FL: '12', // Florida
  GA: '13', // Georgia
  HI: '15', // Hawaii
  ID: '16', // Idaho
  IL: '17', // Illinois
  IN: '18', // Indiana
  IA: '19', // Iowa
  KS: '20', // Kansas
  KY: '21', // Kentucky
  LA: '22', // Louisiana
  ME: '23', // Maine
  MD: '24', // Maryland
  MA: '25', // Massachusetts
  MI: '26', // Michigan
  MN: '27', // Minnesota
  MS: '28', // Mississippi
  MO: '29', // Missouri
  MT: '30', // Montana
  NE: '31', // Nebraska
  NV: '32', // Nevada
  NH: '33', // New Hampshire
  NJ: '34', // New Jersey
  NM: '35', // New Mexico
  NY: '36', // New York
  NC: '37', // North Carolina
  ND: '38', // North Dakota
  OH: '39', // Ohio
  OK: '40', // Oklahoma
  OR: '41', // Oregon
  PA: '42', // Pennsylvania
  RI: '44', // Rhode Island
  SC: '45', // South Carolina
  SD: '46', // South Dakota
  TN: '47', // Tennessee
  TX: '48', // Texas
  UT: '49', // Utah
  VT: '50', // Vermont
  VA: '51', // Virginia
  WA: '53', // Washington
  WV: '54', // West Virginia
  WI: '55', // Wisconsin
  WY: '56', // Wyoming
}

/**
 * Maps FIPS codes to state abbreviations
 */
export const FIPS_TO_STATE_ABBR: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_ABBR_TO_FIPS).map(([abbr, fips]) => [fips, abbr])
)

/**
 * Converts state abbreviation to FIPS code
 * @param abbr State abbreviation (e.g., "MO")
 * @returns FIPS code (e.g., "29") or null if invalid
 */
export function stateAbbrToFips(abbr: string): string | null {
  const normalized = abbr.toUpperCase().trim()
  return STATE_ABBR_TO_FIPS[normalized] || null
}

/**
 * Converts FIPS code to state abbreviation
 * @param fips FIPS code (e.g., "29")
 * @returns State abbreviation (e.g., "MO") or null if invalid
 */
export function fipsToStateAbbr(fips: string): string | null {
  return FIPS_TO_STATE_ABBR[fips] || null
}

/**
 * Validates if a state has congressional districts
 * Some states/territories might not have standard districts
 * @param stateAbbr State abbreviation
 * @returns true if state has congressional districts
 */
export function hasCongressionalDistricts(stateAbbr: string): boolean {
  return !!STATE_ABBR_TO_FIPS[stateAbbr.toUpperCase()]
}
