import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useBillTitles } from "@/hooks/useBillTitles";
import { createQueryWrapper } from "../test-utils";

describe("useBillTitles", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not fetch when required params are missing", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useBillTitles({ enabled: true }), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.titles).toEqual([]);
  });

  it("fetches and returns titles successfully", async () => {
    const mockTitles = [
      { title: "SAVE Act", titleType: "Short Title(s) as Introduced" },
      { title: "Safeguard American Voter Eligibility Act", titleType: "Short Title(s) as Introduced" },
      { title: "To amend the National Voter Registration Act...", titleType: "Official Title as Introduced" },
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true, data: { titles: mockTitles } }),
      }),
    );

    const { result } = renderHook(() => useBillTitles({ billType: "HR", billNumber: "22", congress: 119 }), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.titles).toHaveLength(3);
    expect(result.current.titles[0].title).toBe("SAVE Act");
  });

  it("returns empty titles on fetch failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

    const { result } = renderHook(() => useBillTitles({ billType: "HR", billNumber: "22", congress: 119 }), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.titles).toEqual([]);
  });

  it("returns empty titles when API returns success: false", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ success: false, error: "Not found" }),
      }),
    );

    const { result } = renderHook(() => useBillTitles({ billType: "HR", billNumber: "22", congress: 119 }), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.titles).toEqual([]);
  });

  it("does not fetch when enabled is false", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(
      () => useBillTitles({ billType: "HR", billNumber: "22", congress: 119, enabled: false }),
      { wrapper: createQueryWrapper() },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
