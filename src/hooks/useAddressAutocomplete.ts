import { useState, useEffect, useRef } from "react";
import type { ApiResponse } from "@/lib/api-response";
import { createLogger } from "@/lib/logger";

interface AddressPrediction {
  description: string;
  placeId: string;
}

interface UseAddressAutocompleteReturn {
  predictions: AddressPrediction[];
  loading: boolean;
  fetchPredictions: (input: string) => Promise<void>;
  clearPredictions: () => void;
}

export function useAddressAutocomplete(): UseAddressAutocompleteReturn {
  const logger = createLogger("AddressAutocomplete");
  const [predictions, setPredictions] = useState<AddressPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const fetchPredictions = async (input: string) => {
    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Clear predictions for short inputs
    if (input.length < 3) {
      setPredictions([]);
      return;
    }

    // Debounce API calls
    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/v1/autocomplete?input=${encodeURIComponent(input)}`);
        const result = (await response.json()) as ApiResponse<{ predictions: AddressPrediction[] }>;
        if (!response.ok || !result.success) {
          setPredictions([]);
          return;
        }
        setPredictions(result.data.predictions || []);
      } catch (error) {
        logger.error("Autocomplete error:", error);
        setPredictions([]);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce
  };

  const clearPredictions = () => {
    setPredictions([]);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return {
    predictions,
    loading,
    fetchPredictions,
    clearPredictions,
  };
}
