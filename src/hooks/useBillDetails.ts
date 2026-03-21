import { useQuery } from "@tanstack/react-query";
import type { ApiResponse } from "@/lib/api-response";
import { Bill } from "@/types/congress";

interface UseBillDetailsArgs {
  billType?: string;
  billNumber?: string;
  congress?: number;
  enabled?: boolean;
}

interface UseBillDetailsReturn {
  data: Bill | null;
  loading: boolean;
  error: string | null;
}

async function fetchBillDetails(billType: string, billNumber: string, congress: number): Promise<Bill> {
  let response: Response;
  try {
    response = await fetch(
      `/api/v1/legislation/bill?type=${encodeURIComponent(billType)}&number=${encodeURIComponent(billNumber)}&congress=${congress}`,
    );
  } catch {
    throw new Error("Failed to load bill details");
  }
  const result = (await response.json()) as ApiResponse<Bill>;
  if (!response.ok || !result.success) {
    throw new Error((!result.success && result.error) || "Failed to load bill details");
  }
  return result.data;
}

export function useBillDetails({
  billType,
  billNumber,
  congress = 119,
  enabled = true,
}: UseBillDetailsArgs): UseBillDetailsReturn {
  const canFetch = enabled && !!billType && !!billNumber;

  const { data = null, isPending, error } = useQuery({
    queryKey: ["billDetails", billType, billNumber, congress],
    queryFn: () => fetchBillDetails(billType!, billNumber!, congress),
    enabled: canFetch,
    staleTime: 10 * 60 * 1000,
  });

  return {
    data,
    loading: canFetch && isPending,
    error: error instanceof Error ? error.message : null,
  };
}
