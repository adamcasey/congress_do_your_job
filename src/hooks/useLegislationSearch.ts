import { useInfiniteQuery } from "@tanstack/react-query";
import { Bill } from "@/types/congress";
import type { ApiResponse } from "@/lib/api-response";

const PAGE_SIZE = 8;

interface SearchResponse {
  bills: Bill[];
  count: number;
  query: string;
}

async function fetchLegislationPage(query: string, offset: number): Promise<SearchResponse> {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
  if (query.length >= 2) params.set("q", query);

  const res = await fetch(`/api/v1/legislation/search?${params.toString()}`);
  const result = (await res.json()) as ApiResponse<SearchResponse>;

  if (!result.success) {
    throw new Error(result.error ?? "Failed to load legislation");
  }
  return result.data;
}

export function useLegislationSearch(query: string) {
  return useInfiniteQuery({
    queryKey: ["legislationSearch", query],
    queryFn: ({ pageParam = 0 }) => fetchLegislationPage(query, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.reduce((sum, p) => sum + p.bills.length, 0);
      return fetched < lastPage.count ? fetched : undefined;
    },
    staleTime: 2 * 60 * 1000,
  });
}
