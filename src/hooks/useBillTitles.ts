import { useQuery } from "@tanstack/react-query";
import type { ApiResponse } from "@/lib/api-response";
import type { BillTitle } from "@/types/congress";

interface UseBillTitlesArgs {
  billType?: string;
  billNumber?: string;
  congress?: number;
  enabled?: boolean;
}

async function fetchBillTitles(billType: string, billNumber: string, congress: number): Promise<BillTitle[]> {
  const response = await fetch(
    `/api/v1/legislation/bill/titles?type=${encodeURIComponent(billType)}&number=${encodeURIComponent(billNumber)}&congress=${congress}`,
  );
  const result = (await response.json()) as ApiResponse<{ titles: BillTitle[] }>;
  if (!response.ok || !result.success) {
    throw new Error(!result.success ? result.error : "Failed to load bill titles");
  }
  return result.data.titles;
}

export function useBillTitles({
  billType,
  billNumber,
  congress = 119,
  enabled = true,
}: UseBillTitlesArgs) {
  const canFetch = enabled && !!billType && !!billNumber;

  const { data = [], isPending } = useQuery({
    queryKey: ["billTitles", billType, billNumber, congress],
    queryFn: () => fetchBillTitles(billType!, billNumber!, congress),
    enabled: canFetch,
    staleTime: 30 * 60 * 1000,
  });

  return {
    titles: data,
    loading: canFetch && isPending,
  };
}
