import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAddressAutocomplete } from "@/hooks/useAddressAutocomplete";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("useAddressAutocomplete", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("clears predictions for short input without calling API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() => useAddressAutocomplete());

    await act(async () => {
      await result.current.fetchPredictions("12");
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.predictions).toEqual([]);
  });

  it("fetches predictions after debounce", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        data: {
          predictions: [{ description: "123 Main St", placeId: "abc" }],
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() => useAddressAutocomplete());

    await act(async () => {
      await result.current.fetchPredictions("123 Main");
    });
    await sleep(350);

    await waitFor(() => {
      expect(result.current.predictions).toEqual([{ description: "123 Main St", placeId: "abc" }]);
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/autocomplete?input=123%20Main");
  });

  it("returns empty results for unsuccessful API responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ success: false, error: "rate limited" }),
      }),
    );

    const { result } = renderHook(() => useAddressAutocomplete());

    await act(async () => {
      await result.current.fetchPredictions("123 Main");
    });
    await sleep(350);

    await waitFor(() => {
      expect(result.current.predictions).toEqual([]);
    });
  });

  it("handles request failures and clearPredictions", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

    const { result } = renderHook(() => useAddressAutocomplete());

    await act(async () => {
      await result.current.fetchPredictions("123 Main");
    });
    await sleep(350);

    await waitFor(() => {
      expect(result.current.predictions).toEqual([]);
    });

    act(() => {
      result.current.clearPredictions();
    });
    expect(result.current.predictions).toEqual([]);
  });
});
