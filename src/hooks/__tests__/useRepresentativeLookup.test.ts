import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRepresentativeLookup } from "../useRepresentativeLookup";

const mockRep = { bioguideId: "A000001", name: "Jane Smith", title: "Senator", party: "Independent", state: "MO" };

describe("useRepresentativeLookup", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes with correct default state", () => {
    const { result } = renderHook(() => useRepresentativeLookup());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("");
    expect(result.current.representatives).toEqual([]);
    expect(result.current.location).toBe("");
    expect(result.current.state).toBe("");
    expect(result.current.district).toBe("");
  });

  it("populates representatives on successful lookup", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        data: { representatives: [mockRep], location: "Springfield, MO", state: "MO", district: "07" },
      }),
    }));

    const { result } = renderHook(() => useRepresentativeLookup());

    await act(async () => {
      await result.current.lookupByAddress("123 Main St, Springfield, MO");
    });

    expect(result.current.representatives).toEqual([mockRep]);
    expect(result.current.location).toBe("Springfield, MO");
    expect(result.current.state).toBe("MO");
    expect(result.current.district).toBe("07");
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("");
  });

  it("sets error when response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ success: false, error: "Address not found" }),
    }));

    const { result } = renderHook(() => useRepresentativeLookup());

    await act(async () => {
      await result.current.lookupByAddress("bad address");
    });

    expect(result.current.error).toBe("Address not found");
    expect(result.current.representatives).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it("sets error when result.success is false", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: false, error: "Invalid address format" }),
    }));

    const { result } = renderHook(() => useRepresentativeLookup());

    await act(async () => {
      await result.current.lookupByAddress("???");
    });

    expect(result.current.error).toBe("Invalid address format");
  });

  it("uses fallback error message when error field is missing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ success: false, error: "" }),
    }));

    const { result } = renderHook(() => useRepresentativeLookup());

    await act(async () => {
      await result.current.lookupByAddress("123 Main St");
    });

    expect(result.current.error).toBe("Failed to fetch representatives");
  });

  it("sets error on network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

    const { result } = renderHook(() => useRepresentativeLookup());

    await act(async () => {
      await result.current.lookupByAddress("123 Main St");
    });

    expect(result.current.error).toBe("Network error");
    expect(result.current.loading).toBe(false);
  });

  it("handles non-Error thrown values", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue("unexpected"));

    const { result } = renderHook(() => useRepresentativeLookup());

    await act(async () => {
      await result.current.lookupByAddress("123 Main St");
    });

    expect(result.current.error).toBe("Failed to lookup representatives");
  });

  it("handles missing optional fields in response data", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        data: { representatives: null, location: null, state: null, district: null },
      }),
    }));

    const { result } = renderHook(() => useRepresentativeLookup());

    await act(async () => {
      await result.current.lookupByAddress("123 Main St");
    });

    expect(result.current.representatives).toEqual([]);
    expect(result.current.location).toBe("");
    expect(result.current.state).toBe("");
    expect(result.current.district).toBe("");
  });

  it("reset clears all state", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        data: { representatives: [mockRep], location: "Springfield, MO", state: "MO", district: "07" },
      }),
    }));

    const { result } = renderHook(() => useRepresentativeLookup());

    await act(async () => {
      await result.current.lookupByAddress("123 Main St");
    });

    expect(result.current.representatives).toHaveLength(1);

    act(() => {
      result.current.reset();
    });

    expect(result.current.representatives).toEqual([]);
    expect(result.current.error).toBe("");
    expect(result.current.location).toBe("");
    expect(result.current.state).toBe("");
    expect(result.current.district).toBe("");
  });
});
