import { useQuery } from "@tanstack/react-query";
import type { ApiResponse } from "@/lib/api-response";

export interface BillSummaryData {
  summary: string;
  source: "database" | "generated" | "fallback";
  generatedAt: string;
}

interface UseBillSummaryArgs {
  billType?: string;
  billNumber?: string;
  congress?: number;
  enabled?: boolean;
}

interface UseBillSummaryReturn {
  data: BillSummaryData | null;
  loading: boolean;
  error: string | null;
}

async function fetchBillSummary(billType: string, billNumber: string, congress: number): Promise<BillSummaryData> {
  try {
    const response = await fetch(
      `/api/v1/legislation/bill/summary?type=${encodeURIComponent(billType)}&number=${encodeURIComponent(billNumber)}&congress=${congress}`,
    );
    const result = (await response.json()) as ApiResponse<BillSummaryData>;
    if (!response.ok || !result.success) {
      const errorMessage = !result.success ? result.error : "Failed to load bill summary";
      throw new Error(errorMessage || "Failed to load bill summary");
    }
    return result.data;
  } catch {
    throw new Error("Failed to load bill summary");
  }
}

export function useBillSummary({
  billType,
  billNumber,
  congress = 119,
  enabled = true,
}: UseBillSummaryArgs): UseBillSummaryReturn {
  const canFetch = enabled && !!billType && !!billNumber;

  const { data = null, isPending, error } = useQuery({
    queryKey: ["billSummary", billType, billNumber, congress],
    queryFn: () => fetchBillSummary(billType!, billNumber!, congress),
    enabled: canFetch,
    staleTime: 30 * 60 * 1000,
  });

  return {
    data,
    loading: canFetch && isPending,
    error: error instanceof Error ? error.message : null,
  };
}
