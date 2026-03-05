import { describe, it, expect } from "vitest";
import { stateAbbrToFips, fipsToStateAbbr, hasCongressionalDistricts, STATE_ABBR_TO_FIPS, FIPS_TO_STATE_ABBR } from "../states";

describe("stateAbbrToFips", () => {
  it("returns FIPS code for valid uppercase abbreviation", () => {
    expect(stateAbbrToFips("MO")).toBe("29");
    expect(stateAbbrToFips("CA")).toBe("06");
    expect(stateAbbrToFips("NY")).toBe("36");
  });

  it("normalizes lowercase input", () => {
    expect(stateAbbrToFips("mo")).toBe("29");
    expect(stateAbbrToFips("ca")).toBe("06");
  });

  it("trims whitespace before lookup", () => {
    expect(stateAbbrToFips("  MO  ")).toBe("29");
  });

  it("returns null for invalid state abbreviation", () => {
    expect(stateAbbrToFips("XX")).toBeNull();
    expect(stateAbbrToFips("")).toBeNull();
  });

  it("covers all 50 states", () => {
    for (const [abbr, fips] of Object.entries(STATE_ABBR_TO_FIPS)) {
      expect(stateAbbrToFips(abbr)).toBe(fips);
    }
  });
});

describe("fipsToStateAbbr", () => {
  it("returns state abbreviation for valid FIPS code", () => {
    expect(fipsToStateAbbr("29")).toBe("MO");
    expect(fipsToStateAbbr("06")).toBe("CA");
    expect(fipsToStateAbbr("36")).toBe("NY");
  });

  it("returns null for invalid FIPS code", () => {
    expect(fipsToStateAbbr("99")).toBeNull();
    expect(fipsToStateAbbr("")).toBeNull();
  });

  it("covers all states in FIPS_TO_STATE_ABBR", () => {
    for (const [fips, abbr] of Object.entries(FIPS_TO_STATE_ABBR)) {
      expect(fipsToStateAbbr(fips)).toBe(abbr);
    }
  });
});

describe("hasCongressionalDistricts", () => {
  it("returns true for valid state abbreviations", () => {
    expect(hasCongressionalDistricts("MO")).toBe(true);
    expect(hasCongressionalDistricts("CA")).toBe(true);
    expect(hasCongressionalDistricts("WY")).toBe(true);
  });

  it("normalizes lowercase input", () => {
    expect(hasCongressionalDistricts("mo")).toBe(true);
  });

  it("returns false for invalid state abbreviations", () => {
    expect(hasCongressionalDistricts("XX")).toBe(false);
    expect(hasCongressionalDistricts("")).toBe(false);
  });
});
