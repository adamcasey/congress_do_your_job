import { useEffect, useState } from "react";
import type { CongressStatsResponse, UseCongressStatsReturn } from "@/types/legislation";
import type { ApiResponse } from "@/lib/api-response";

export function useCongressStats(): UseCongressStatsReturn {
  const [data, setData] = useState<CongressStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    const fetchStats = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/v1/congress/stats", {
          signal: controller.signal,
        });

        if (!isActive) return;

        const result = (await response.json()) as ApiResponse<CongressStatsResponse>;

        if (!response.ok || !result.success) {
          const msg = !result.success ? result.error : "Failed to fetch congress stats";
          throw new Error(msg || "Failed to fetch congress stats");
        }

        setData(result.data);
      } catch (err) {
        if (!isActive || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load congress stats");
        setData(null);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    fetchStats();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  return { data, loading, error };
}
