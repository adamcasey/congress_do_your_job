import { useQuery } from "@tanstack/react-query";
import type { ApiResponse } from "@/lib/api-response";

export interface DistrictData {
  districtName: string;
  population: number | null;
  medianAge: number | null;
  nextElection: string | null;
  error?: string;
}

interface UseDistrictSnapshotArgs {
  state?: string;
  district?: string;
  isPlaceholder?: boolean;
}

interface UseDistrictSnapshotReturn {
  data: DistrictData | null;
  loading: boolean;
}

async function fetchDistrictData(state: string, district: string): Promise<DistrictData> {
  try {
    const response = await fetch(
      `/api/v1/district?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`,
    );
    const result = (await response.json()) as ApiResponse<DistrictData>;

    if (!response.ok || !result.success) {
      return {
        districtName: `District ${district}`,
        population: null,
        medianAge: null,
        nextElection: null,
        error: result.success ? "Unable to load district data" : result.error || "Unable to load district data",
      };
    }

    return result.data;
  } catch {
    return {
      districtName: `District ${district}`,
      population: null,
      medianAge: null,
      nextElection: null,
      error: "Failed to load district data",
    };
  }
}

const NO_DISTRICT_DATA: DistrictData = {
  districtName: "No district data",
  population: null,
  medianAge: null,
  nextElection: null,
  error: "District information not available",
};

export function useDistrictSnapshot({
  state,
  district,
  isPlaceholder = false,
}: UseDistrictSnapshotArgs): UseDistrictSnapshotReturn {
  const canFetch = !isPlaceholder && !!state && !!district;

  const { data, isPending } = useQuery({
    queryKey: ["districtSnapshot", state, district],
    queryFn: () => fetchDistrictData(state!, district!),
    enabled: canFetch,
    staleTime: 60 * 60 * 1000,
    placeholderData: !isPlaceholder && (!state || !district) ? NO_DISTRICT_DATA : undefined,
  });

  const resolvedData = isPlaceholder
    ? null
    : !state || !district
      ? NO_DISTRICT_DATA
      : (data ?? null);

  return {
    data: resolvedData,
    loading: canFetch && isPending,
  };
}
