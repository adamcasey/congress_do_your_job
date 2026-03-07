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
  try {
    const response = await fetch(
      `/api/v1/legislation/bill?type=${encodeURIComponent(billType)}&number=${encodeURIComponent(billNumber)}&congress=${congress}`,
    );
    const result = (await response.json()) as ApiResponse<Bill>;
    if (!response.ok || !result.success) {
      const errorMessage = !result.success ? result.error : "Failed to load bill details";
      throw new Error(errorMessage || "Failed to load bill details");
    }
    return result.data;
  } catch {
    throw new Error("Failed to load bill details");
  }
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
