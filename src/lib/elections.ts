/**
 * Election date calculation utilities and constants
 *
 * Federal elections occur on the first Tuesday after the first Monday in November
 * - House: Every 2 years (all seats)
 * - Senate: Every 6 years (staggered into 3 classes)
 */

/**
 * Senate election classes
 * Senators are divided into three classes to ensure staggered elections
 */
export enum SenateClass {
  /** Class I: Elections in 2024, 2030, 2036... */
  CLASS_I = 1,
  /** Class II: Elections in 2026, 2032, 2038... */
  CLASS_II = 2,
  /** Class III: Elections in 2028, 2034, 2040... */
  CLASS_III = 3,
}

/**
 * Base election years for each Senate class
 * These are fixed reference points used to calculate future elections
 */
const SENATE_CLASS_BASE_YEARS: Record<SenateClass, number> = {
  [SenateClass.CLASS_I]: 2024,
  [SenateClass.CLASS_II]: 2026,
  [SenateClass.CLASS_III]: 2028,
};

/**
 * Senate election class by state FIPS code
 * Maps each state to its Senate election class
 */
export const SENATE_CLASS_BY_STATE_FIPS: Record<string, SenateClass> = {
  "01": SenateClass.CLASS_II, // Alabama
  "02": SenateClass.CLASS_II, // Alaska
  "04": SenateClass.CLASS_I, // Arizona
  "05": SenateClass.CLASS_II, // Arkansas
  "06": SenateClass.CLASS_I, // California
  "08": SenateClass.CLASS_II, // Colorado
  "09": SenateClass.CLASS_I, // Connecticut
  "10": SenateClass.CLASS_I, // Delaware
  "12": SenateClass.CLASS_I, // Florida
  "13": SenateClass.CLASS_II, // Georgia
  "15": SenateClass.CLASS_I, // Hawaii
  "16": SenateClass.CLASS_II, // Idaho
  "17": SenateClass.CLASS_II, // Illinois
  "18": SenateClass.CLASS_I, // Indiana
  "19": SenateClass.CLASS_II, // Iowa
  "20": SenateClass.CLASS_II, // Kansas
  "21": SenateClass.CLASS_II, // Kentucky
  "22": SenateClass.CLASS_II, // Louisiana
  "23": SenateClass.CLASS_I, // Maine
  "24": SenateClass.CLASS_I, // Maryland
  "25": SenateClass.CLASS_I, // Massachusetts
  "26": SenateClass.CLASS_I, // Michigan
  "27": SenateClass.CLASS_I, // Minnesota
  "28": SenateClass.CLASS_I, // Mississippi
  "29": SenateClass.CLASS_I, // Missouri
  "30": SenateClass.CLASS_I, // Montana
  "31": SenateClass.CLASS_I, // Nebraska
  "32": SenateClass.CLASS_I, // Nevada
  "33": SenateClass.CLASS_II, // New Hampshire
  "34": SenateClass.CLASS_I, // New Jersey
  "35": SenateClass.CLASS_I, // New Mexico
  "36": SenateClass.CLASS_I, // New York
  "37": SenateClass.CLASS_II, // North Carolina
  "38": SenateClass.CLASS_I, // North Dakota
  "39": SenateClass.CLASS_I, // Ohio
  "40": SenateClass.CLASS_II, // Oklahoma
  "41": SenateClass.CLASS_II, // Oregon
  "42": SenateClass.CLASS_I, // Pennsylvania
  "44": SenateClass.CLASS_I, // Rhode Island
  "45": SenateClass.CLASS_II, // South Carolina
  "46": SenateClass.CLASS_II, // South Dakota
  "47": SenateClass.CLASS_I, // Tennessee
  "48": SenateClass.CLASS_I, // Texas
  "49": SenateClass.CLASS_I, // Utah
  "50": SenateClass.CLASS_II, // Vermont
  "51": SenateClass.CLASS_I, // Virginia
  "53": SenateClass.CLASS_II, // Washington
  "54": SenateClass.CLASS_I, // West Virginia
  "55": SenateClass.CLASS_I, // Wisconsin
  "56": SenateClass.CLASS_I, // Wyoming
};

/**
 * Gets the first Tuesday after the first Monday in November for a given year
 * @param year The election year
 * @returns Date object for Election Day
 */
export function getElectionDayForYear(year: number): Date {
  const nov1 = new Date(year, 10, 1); // Month is 0-indexed, so 10 = November
  const dayOfWeek = nov1.getDay(); // 0 = Sunday, 1 = Monday, etc.

  let firstMonday: number;
  if (dayOfWeek === 0) {
    firstMonday = 2; // Nov 1 is Sunday, first Monday is Nov 2
  } else if (dayOfWeek === 1) {
    firstMonday = 1; // Nov 1 is Monday, first Monday is Nov 1
  } else {
    firstMonday = 8 - dayOfWeek + 1; // First Monday after Nov 1
  }

  const electionDay = firstMonday + 1; // Tuesday after first Monday
  return new Date(year, 10, electionDay);
}

/**
 * Gets the next House election date (every 2 years)
 */
export function getNextHouseElection(): Date {
  const currentYear = new Date().getFullYear();
  const currentDate = new Date();

  // House elections are in even years
  let nextElectionYear = currentYear % 2 === 0 ? currentYear : currentYear + 1;
  let nextElection = getElectionDayForYear(nextElectionYear);

  // If this year's election has passed, move to next cycle
  if (nextElection < currentDate) {
    nextElectionYear += 2;
    nextElection = getElectionDayForYear(nextElectionYear);
  }

  return nextElection;
}

/**
 * Gets the next Senate election date for a given state (every 6 years, staggered by class)
 * @param stateFips State FIPS code (e.g., "29" for Missouri)
 */
export function getNextSenateElection(stateFips: string): Date | null {
  const senateClass = SENATE_CLASS_BY_STATE_FIPS[stateFips];
  if (!senateClass) return null;

  const currentYear = new Date().getFullYear();
  const currentDate = new Date();
  const baseYear = SENATE_CLASS_BASE_YEARS[senateClass];

  // Calculate how many 6-year cycles have passed since the base year
  const yearsSinceBase = currentYear - baseYear;
  const cyclesPassed = Math.floor(yearsSinceBase / 6);

  // Next election is in the next cycle
  let nextElectionYear = baseYear + (cyclesPassed + 1) * 6;

  // But if we're in an election year and it hasn't happened yet, use current year
  if (yearsSinceBase % 6 === 0) {
    const electionThisYear = getElectionDayForYear(currentYear);
    if (electionThisYear >= currentDate) {
      nextElectionYear = currentYear;
    }
  }

  return getElectionDayForYear(nextElectionYear);
}

/**
 * Formats an election date for display
 * - Within 60 days: "Nov 5, 2024"
 * - Same year: "Nov 2024"
 * - Future years: "Nov 2026"
 */
export function formatElectionDate(date: Date): string {
  const now = new Date();
  const daysUntil = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const month = date.toLocaleDateString("en-US", { month: "short" });
  const year = date.getFullYear();

  if (daysUntil < 60) {
    const day = date.getDate();
    return `${month} ${day}, ${year}`;
  } else if (date.getFullYear() === now.getFullYear()) {
    return `${month} ${year}`;
  } else {
    return `${month} ${year}`;
  }
}
