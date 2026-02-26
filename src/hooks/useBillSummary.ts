import { useEffect, useState } from "react";
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

export function useBillSummary({
  billType,
  billNumber,
  congress = 119,
  enabled = true,
}: UseBillSummaryArgs): UseBillSummaryReturn {
  const [data, setData] = useState<BillSummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !billType || !billNumber) {
      setLoading(false);
      return;
    }

    let isActive = true;
    const controller = new AbortController();

    const fetchSummary = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/v1/legislation/bill/summary?type=${encodeURIComponent(billType)}&number=${encodeURIComponent(billNumber)}&congress=${congress}`,
          { signal: controller.signal },
        );

        if (!isActive) {
          return;
        }

        const result = (await response.json()) as ApiResponse<BillSummaryData>;

        if (!response.ok || !result.success) {
          const errorMessage = !result.success ? result.error : "Failed to load bill summary";
          setError(errorMessage || "Failed to load bill summary");
          return;
        }

        setData(result.data);
      } catch (err) {
        if (!isActive || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }
        setError("Failed to load bill summary");
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchSummary();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [billType, billNumber, congress, enabled]);

  return { data, loading, error };
}
