import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useRepresentativeLookup } from "@/hooks/useRepresentativeLookup";

describe("useRepresentativeLookup", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads representatives successfully", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        data: {
          representatives: [{ id: "1", name: "Rep", phone: "202" }],
          location: "Springfield",
          state: "MO",
          district: "02",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useRepresentativeLookup());

    await act(async () => {
      await result.current.lookupByAddress("123 Main St");
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/representatives?address=123%20Main%20St");
    expect(result.current.representatives).toEqual([{ id: "1", name: "Rep", phone: "202" }]);
    expect(result.current.location).toBe("Springfield");
    expect(result.current.state).toBe("MO");
    expect(result.current.district).toBe("02");
    expect(result.current.error).toBe("");
  });

  it("sets errors from failed API responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: "Address not found",
        }),
      }),
    );

    const { result } = renderHook(() => useRepresentativeLookup());
    await act(async () => {
      await result.current.lookupByAddress("bad address");
    });

    expect(result.current.error).toBe("Address not found");
    expect(result.current.representatives).toEqual([]);
  });

  it("falls back to a generic lookup error for thrown non-Error values", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue("boom"));

    const { result } = renderHook(() => useRepresentativeLookup());
    await act(async () => {
      await result.current.lookupByAddress("123 Main St");
    });

    expect(result.current.error).toBe("Failed to lookup representatives");
  });

  it("reset clears state", () => {
    const { result } = renderHook(() => useRepresentativeLookup());
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
