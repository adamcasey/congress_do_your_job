import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  formatElectionDate,
  getElectionDayForYear,
  getNextHouseElection,
  getNextSenateElection,
} from '@/lib/elections'

describe('election utilities', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('calculates election day as the first Tuesday after the first Monday', () => {
    const electionDay = getElectionDayForYear(2026)
    expect(electionDay.getFullYear()).toBe(2026)
    expect(electionDay.getMonth()).toBe(10)
    expect(electionDay.getDate()).toBe(3)
  })

  it('returns the current cycle house election when not yet passed', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-09T12:00:00Z'))

    const nextElection = getNextHouseElection()
    expect(nextElection.getFullYear()).toBe(2026)
  })

  it('returns the next cycle house election after election day passes', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-12-01T12:00:00Z'))

    const nextElection = getNextHouseElection()
    expect(nextElection.getFullYear()).toBe(2028)
  })

  it('returns next senate election by state class and null for unknown states', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-09T12:00:00Z'))

    const missouriElection = getNextSenateElection('29')
    const alabamaElection = getNextSenateElection('01')
    const unknownElection = getNextSenateElection('00')

    expect(missouriElection?.getFullYear()).toBe(2030)
    expect(alabamaElection?.getFullYear()).toBe(2026)
    expect(unknownElection).toBeNull()
  })

  it('formats election dates based on distance from now', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-01T12:00:00Z'))

    expect(formatElectionDate(new Date('2026-09-15T12:00:00Z'))).toMatch(/Sep \d{1,2}, 2026/)
    expect(formatElectionDate(new Date('2026-11-03T12:00:00Z'))).toBe('Nov 2026')
    expect(formatElectionDate(new Date('2028-11-07T12:00:00Z'))).toBe('Nov 2028')
  })
})
