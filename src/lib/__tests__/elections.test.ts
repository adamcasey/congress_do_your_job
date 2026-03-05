import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getElectionDayForYear,
  getNextHouseElection,
  getNextSenateElection,
  formatElectionDate,
} from "../elections";

describe("getElectionDayForYear", () => {
  it("returns a Tuesday in November", () => {
    const date = getElectionDayForYear(2024);
    expect(date.getMonth()).toBe(10); // November (0-indexed)
    expect(date.getDay()).toBe(2); // Tuesday
  });

  it("handles Nov 1 being a Sunday (first Monday = Nov 2)", () => {
    // Nov 1, 2020 is a Sunday
    const date = getElectionDayForYear(2020);
    expect(date.getMonth()).toBe(10);
    expect(date.getDay()).toBe(2);
    expect(date.getDate()).toBe(3); // Nov 3
  });

  it("handles Nov 1 being a Monday (first Monday = Nov 1)", () => {
    // Nov 1, 2021 is a Monday
    const date = getElectionDayForYear(2021);
    expect(date.getMonth()).toBe(10);
    expect(date.getDay()).toBe(2);
    expect(date.getDate()).toBe(2); // Nov 2
  });

  it("handles Nov 1 being another day (first Monday later)", () => {
    // Nov 1, 2022 is a Tuesday — first Monday is Nov 7, election is Nov 8
    const date = getElectionDayForYear(2022);
    expect(date.getMonth()).toBe(10);
    expect(date.getDay()).toBe(2);
    expect(date.getDate()).toBe(8); // Nov 8
  });
});

describe("getNextHouseElection", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns current even year if election has not passed", () => {
    // Set date to Jan 1 of an even year
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1));
    const election = getNextHouseElection();
    expect(election.getFullYear()).toBe(2026);
    expect(election.getMonth()).toBe(10);
  });

  it("advances to next even year if current year election has already passed", () => {
    // Set date to Dec 1 of an even year (after Nov election)
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 11, 1));
    const election = getNextHouseElection();
    expect(election.getFullYear()).toBe(2028);
  });

  it("rounds up odd year to next even year", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 1));
    const election = getNextHouseElection();
    expect(election.getFullYear()).toBe(2026);
  });
});

describe("getNextSenateElection", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null for invalid FIPS code", () => {
    expect(getNextSenateElection("99")).toBeNull();
    expect(getNextSenateElection("")).toBeNull();
  });

  it("returns a future election date for a valid FIPS code", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 1));
    const election = getNextSenateElection("29"); // Missouri - Class I
    expect(election).not.toBeNull();
    expect(election!.getMonth()).toBe(10);
  });

  it("returns current year election if it has not yet passed (base year alignment)", () => {
    // Class I base year is 2024, so 2024 is an election year
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 1)); // Jan 1, 2024 — election not yet passed
    const election = getNextSenateElection("29"); // Missouri - Class I
    expect(election!.getFullYear()).toBe(2024);
  });

  it("skips to next cycle when current base year election has already passed", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 11, 1)); // Dec 1, 2024 — election passed
    const election = getNextSenateElection("29"); // Missouri - Class I
    expect(election!.getFullYear()).toBe(2030);
  });
});

describe("formatElectionDate", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("includes full date when within 60 days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 1)); // Oct 1
    const date = new Date(2026, 10, 3); // Nov 3 — 33 days away
    const result = formatElectionDate(date);
    expect(result).toMatch(/Nov 3, 2026/);
  });

  it("returns month and year when more than 60 days away in same year", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1)); // Jan 1
    const date = new Date(2026, 10, 3); // Nov 3 — ~306 days away
    const result = formatElectionDate(date);
    expect(result).toMatch(/Nov 2026/);
    expect(result).not.toMatch(/Nov \d+, 2026/);
  });

  it("returns month and year for future year", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 1));
    const date = new Date(2026, 10, 3);
    const result = formatElectionDate(date);
    expect(result).toMatch(/Nov 2026/);
  });
});
