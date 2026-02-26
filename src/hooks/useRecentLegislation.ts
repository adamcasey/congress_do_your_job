import { useEffect, useState } from "react";
import { RecentLegislationData, UseRecentLegislationArgs, UseRecentLegislationReturn } from "@/types/legislation";
import type { ApiResponse } from "@/lib/api-response";

export function useRecentLegislation({
  limit = 20,
  days = 7,
  enabled = true,
}: UseRecentLegislationArgs = {}): UseRecentLegislationReturn {
  const [data, setData] = useState<RecentLegislationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let isActive = true;
    const controller = new AbortController();

    const fetchLegislation = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/v1/legislation/recent?limit=${limit}&days=${days}`, { signal: controller.signal });

        if (!isActive) return;

        const result = (await response.json()) as ApiResponse<RecentLegislationData>;

        if (!response.ok || !result.success) {
          const errorMessage = !result.success ? result.error : "Failed to fetch recent legislation";
          throw new Error(errorMessage || "Failed to fetch recent legislation");
        }

        setData(result.data);
      } catch (err) {
        if (!isActive || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }

        const errorMessage = err instanceof Error ? err.message : "Failed to load recent legislation";
        setError(errorMessage);
        setData(null);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchLegislation();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [limit, days, enabled]);

  return { data, loading, error };
}
