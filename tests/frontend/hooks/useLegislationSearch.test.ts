import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useLegislationSearch } from "@/hooks/useLegislationSearch";
import { createQueryWrapper } from "../test-utils";

const mockPage1 = {
  success: true,
  data: {
    bills: [
      { congress: 119, type: "HR", number: "1", title: "Bill One", updateDate: "2026-01-01" },
      { congress: 119, type: "HR", number: "2", title: "Bill Two", updateDate: "2026-01-02" },
    ],
    count: 10,
    query: "",
  },
};

const mockPage2 = {
  success: true,
  data: {
    bills: [
      { congress: 119, type: "HR", number: "3", title: "Bill Three", updateDate: "2026-01-03" },
    ],
    count: 10,
    query: "",
  },
};

describe("useLegislationSearch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches first page on mount", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockPage1),
      }),
    );

    const { result } = renderHook(() => useLegislationSearch(""), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const bills = result.current.data?.pages.flatMap((p) => p.bills) ?? [];
    expect(bills).toHaveLength(2);
    expect(bills[0].title).toBe("Bill One");
  });

  it("reports hasNextPage true when more results exist than fetched", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(mockPage1) }));

    const { result } = renderHook(() => useLegislationSearch(""), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // count=10, fetched=2 → hasNextPage should be true
    expect(result.current.hasNextPage).toBe(true);
    // fetchNextPage should be callable (the hook exposes it)
    expect(typeof result.current.fetchNextPage).toBe("function");
  });

  it("reports no next page when all results fetched", async () => {
    const fullData = {
      success: true,
      data: { bills: [{ congress: 119, type: "HR", number: "1", title: "Only Bill", updateDate: "2026-01-01" }], count: 1, query: "" },
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue(fullData) }));

    const { result } = renderHook(() => useLegislationSearch(""), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(false);
  });

  it("passes query param to search endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true, data: { bills: [], count: 0, query: "climate" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useLegislationSearch("climate"), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const callUrl = (fetchMock.mock.calls[0] as [string])[0];
    expect(callUrl).toContain("q=climate");
  });

  it("throws on API error response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ success: false, error: "Service unavailable" }),
    }));

    const { result } = renderHook(() => useLegislationSearch(""), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
