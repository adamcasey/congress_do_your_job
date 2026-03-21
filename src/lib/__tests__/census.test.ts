import { describe, it, expect, vi, beforeEach } from "vitest";
import { isCensusArrayResponse, extractCensusValue, parseCensusNumber, fetchCensusData, CensusApiException } from "../census";

describe("isCensusArrayResponse", () => {
  it("returns true for valid census array response", () => {
    const data = [["NAME", "B01003_001E"], ["Missouri", "6154913"]];
    expect(isCensusArrayResponse(data)).toBe(true);
  });

  it("returns false for non-array input", () => {
    expect(isCensusArrayResponse(null)).toBe(false);
    expect(isCensusArrayResponse("string")).toBe(false);
    expect(isCensusArrayResponse(42)).toBe(false);
    expect(isCensusArrayResponse({})).toBe(false);
  });

  it("returns false for empty array", () => {
    expect(isCensusArrayResponse([])).toBe(false);
  });

  it("returns false for array with only one row", () => {
    expect(isCensusArrayResponse([["NAME"]])).toBe(false);
  });

  it("returns false when rows are not arrays", () => {
    expect(isCensusArrayResponse(["header", "values"])).toBe(false);
  });
});

describe("extractCensusValue", () => {
  const sampleData: string[][] = [
    ["NAME", "B01003_001E", "state", "congressional district"],
    ["District 2, Missouri", "766987", "29", "02"],
  ];

  it("returns value for existing column", () => {
    expect(extractCensusValue(sampleData, "NAME")).toBe("District 2, Missouri");
    expect(extractCensusValue(sampleData, "B01003_001E")).toBe("766987");
    expect(extractCensusValue(sampleData, "state")).toBe("29");
  });

  it("returns null for missing column", () => {
    expect(extractCensusValue(sampleData, "nonexistent")).toBeNull();
  });

  it("returns null for invalid data (too few rows)", () => {
    expect(extractCensusValue([["only-header"]], "NAME")).toBeNull();
  });
});

describe("parseCensusNumber", () => {
  it("parses valid numeric strings", () => {
    expect(parseCensusNumber("766987")).toBe(766987);
    expect(parseCensusNumber("3.14")).toBe(3.14);
    expect(parseCensusNumber("0")).toBe(0);
  });

  it("returns null for null input", () => {
    expect(parseCensusNumber(null)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseCensusNumber("")).toBeNull();
  });

  it("returns null for non-numeric strings", () => {
    expect(parseCensusNumber("abc")).toBeNull();
    expect(parseCensusNumber("N/A")).toBeNull();
  });
});

describe("fetchCensusData", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches and parses JSON successfully with all options", async () => {
    const mockData = [["NAME", "B01003_001E"], ["District 2", "766987"]];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(JSON.stringify(mockData)),
    }));

    const result = await fetchCensusData({
      year: "2022",
      dataset: "acs/acs5",
      variables: "NAME,B01003_001E",
      geographyFor: "congressional district:02",
      geographyIn: "state:29",
      apiKey: "test-key",
    });

    expect(result).toEqual(mockData);
  });

  it("fetches successfully without optional geographyIn and apiKey", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue("[[\"NAME\"],[\"test\"]]"),
    });
    vi.stubGlobal("fetch", mockFetch);

    await fetchCensusData({
      year: "2022",
      dataset: "acs/acs5",
      variables: "NAME",
      geographyFor: "state:29",
    });

    const calledUrl: string = mockFetch.mock.calls[0][0];
    expect(calledUrl).not.toContain("in=");
    expect(calledUrl).not.toContain("key=");
  });

  it("throws CensusApiException on network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network failure")));

    await expect(
      fetchCensusData({ year: "2022", dataset: "acs/acs5", variables: "NAME", geographyFor: "state:29" })
    ).rejects.toThrow(CensusApiException);
  });

  it("throws CensusApiException on non-ok HTTP response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: vi.fn().mockResolvedValue("Not Found"),
    }));

    await expect(
      fetchCensusData({ year: "2022", dataset: "acs/acs5", variables: "NAME", geographyFor: "state:99" })
    ).rejects.toThrow(CensusApiException);
  });

  it("throws CensusApiException on empty response body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue("   "),
    }));

    await expect(
      fetchCensusData({ year: "2022", dataset: "acs/acs5", variables: "NAME", geographyFor: "state:29" })
    ).rejects.toThrow(CensusApiException);
  });

  it("throws CensusApiException on invalid JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue("not-valid-json{{"),
    }));

    await expect(
      fetchCensusData({ year: "2022", dataset: "acs/acs5", variables: "NAME", geographyFor: "state:29" })
    ).rejects.toThrow(CensusApiException);
  });

  it("throws CensusApiException on response read error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockRejectedValue(new Error("Read failed")),
    }));

    await expect(
      fetchCensusData({ year: "2022", dataset: "acs/acs5", variables: "NAME", geographyFor: "state:29" })
    ).rejects.toThrow(CensusApiException);
  });
});
