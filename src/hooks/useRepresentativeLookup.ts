import { useMutation } from "@tanstack/react-query";
import type { ApiResponse } from "@/lib/api-response";
import { Representative } from "@/types/representative";

interface RepresentativeData {
  representatives: Representative[];
  location: string;
  state: string;
  district: string;
}

interface UseRepresentativeLookupReturn {
  loading: boolean;
  error: string;
  representatives: Representative[];
  location: string;
  state: string;
  district: string;
  lookupByAddress: (address: string) => Promise<void>;
  reset: () => void;
}

async function fetchRepresentatives(address: string): Promise<RepresentativeData> {
  const response = await fetch(`/api/v1/representatives?address=${encodeURIComponent(address)}`);
  const result = (await response.json()) as ApiResponse<RepresentativeData>;
  if (!response.ok || !result.success) {
    const errorMessage = !result.success ? result.error : "Failed to fetch representatives";
    throw new Error(errorMessage || "Failed to fetch representatives");
  }
  return result.data;
}

export function useRepresentativeLookup(): UseRepresentativeLookupReturn {
  const mutation = useMutation({ mutationFn: fetchRepresentatives });

  return {
    loading: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : mutation.isError ? "Failed to lookup representatives" : "",
    representatives: mutation.data?.representatives ?? [],
    location: mutation.data?.location ?? "",
    state: mutation.data?.state ?? "",
    district: mutation.data?.district ?? "",
    lookupByAddress: (address: string) => mutation.mutateAsync(address).then(() => undefined),
    reset: mutation.reset,
  };
}
