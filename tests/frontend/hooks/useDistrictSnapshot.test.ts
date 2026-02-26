import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useDistrictSnapshot } from "@/hooks/useDistrictSnapshot";

describe("useDistrictSnapshot", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns null data for placeholder mode", async () => {
    const { result } = renderHook(() => useDistrictSnapshot({ state: "MO", district: "02", isPlaceholder: true }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.data).toBeNull();
  });

  it("returns fallback message when required location data is missing", async () => {
    const { result } = renderHook(() => useDistrictSnapshot({}));

    await waitFor(() => {
      expect(result.current.data?.error).toBe("District information not available");
    });
  });

  it("loads district snapshot data from the API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: {
            districtName: "Missouri Congressional District 2",
            population: 766000,
            medianAge: 38.2,
            nextElection: "Nov 2026",
          },
        }),
      }),
    );

    const { result } = renderHook(() => useDistrictSnapshot({ state: "MO", district: "02" }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.data).toEqual({
      districtName: "Missouri Congressional District 2",
      population: 766000,
      medianAge: 38.2,
      nextElection: "Nov 2026",
    });
  });

  it("returns endpoint errors in fallback payload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: "Failed to fetch district data",
        }),
      }),
    );

    const { result } = renderHook(() => useDistrictSnapshot({ state: "MO", district: "02" }));

    await waitFor(() => {
      expect(result.current.data?.error).toBe("Failed to fetch district data");
    });
  });

  it("handles network failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const { result } = renderHook(() => useDistrictSnapshot({ state: "MO", district: "02" }));

    await waitFor(() => {
      expect(result.current.data?.error).toBe("Failed to load district data");
    });
  });
});
