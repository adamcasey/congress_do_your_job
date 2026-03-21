import { useQuery } from "@tanstack/react-query";
import type { ApiResponse } from "@/lib/api-response";
import type { VotingRecordResponse } from "@/app/api/v1/votes/[bioguideId]/route";

async function fetchVotingRecord(bioguideId: string): Promise<VotingRecordResponse> {
  const res = await fetch(`/api/v1/votes/${bioguideId}?limit=10`);
  const result = (await res.json()) as ApiResponse<VotingRecordResponse>;
  if (!res.ok || !result.success) {
    throw new Error((result as { error?: string }).error ?? "Failed to load voting record");
  }
  return result.data;
}

export function useVotingRecord(bioguideId: string | null, enabled = false) {
  return useQuery({
    queryKey: ["votingRecord", bioguideId],
    queryFn: () => fetchVotingRecord(bioguideId!),
    enabled: enabled && !!bioguideId,
    staleTime: 30 * 60 * 1000,
    retry: 0,
  });
}
