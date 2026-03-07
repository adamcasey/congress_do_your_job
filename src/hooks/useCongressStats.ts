import { useQuery } from "@tanstack/react-query";
import type { CongressStatsResponse, UseCongressStatsReturn } from "@/types/legislation";
import type { ApiResponse } from "@/lib/api-response";

async function fetchCongressStats(): Promise<CongressStatsResponse> {
  const response = await fetch("/api/v1/congress/stats");
  const result = (await response.json()) as ApiResponse<CongressStatsResponse>;
  if (!response.ok || !result.success) {
    const msg = !result.success ? result.error : "Failed to fetch congress stats";
    throw new Error(msg || "Failed to fetch congress stats");
  }
  return result.data;
}

export function useCongressStats(): UseCongressStatsReturn {
  const { data = null, isPending, error } = useQuery({
    queryKey: ["congressStats"],
    queryFn: fetchCongressStats,
    staleTime: 5 * 60 * 1000,
  });

  return {
    data,
    loading: isPending,
    error: error ? (error instanceof Error ? error.message : "Failed to load congress stats") : null,
  };
}
