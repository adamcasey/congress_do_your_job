import { useQuery } from "@tanstack/react-query";
import { RecentLegislationData, UseRecentLegislationArgs, UseRecentLegislationReturn } from "@/types/legislation";
import type { ApiResponse } from "@/lib/api-response";

async function fetchRecentLegislation(limit: number, days: number): Promise<RecentLegislationData> {
  const response = await fetch(`/api/v1/legislation/recent?limit=${limit}&days=${days}`);
  const result = (await response.json()) as ApiResponse<RecentLegislationData>;
  if (!response.ok || !result.success) {
    const errorMessage = !result.success ? result.error : "Failed to fetch recent legislation";
    throw new Error(errorMessage || "Failed to fetch recent legislation");
  }
  return result.data;
}

export function useRecentLegislation({
  limit = 20,
  days = 7,
  enabled = true,
}: UseRecentLegislationArgs = {}): UseRecentLegislationReturn {
  const { data = null, isPending, error } = useQuery({
    queryKey: ["recentLegislation", limit, days],
    queryFn: () => fetchRecentLegislation(limit, days),
    enabled,
    staleTime: 2 * 60 * 1000,
  });

  return {
    data,
    loading: enabled && isPending,
    error: error ? (error instanceof Error ? error.message : "Failed to load recent legislation") : null,
  };
}
