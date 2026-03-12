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
  let response: Response;
  try {
    response = await fetch(
      `/api/v1/legislation/bill/summary?type=${encodeURIComponent(billType)}&number=${encodeURIComponent(billNumber)}&congress=${congress}`,
    );
  } catch {
    throw new Error("Failed to load bill summary");
  }
  const result = (await response.json()) as ApiResponse<BillSummaryData>;
  if (!response.ok || !result.success) {
    throw new Error((!result.success && result.error) || "Failed to load bill summary");
  }
  return result.data;
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
