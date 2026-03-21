import { useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import type { ApiResponse } from "@/lib/api-response";

interface AddressPrediction {
  description: string;
  placeId: string;
}

interface UseAddressAutocompleteReturn {
  predictions: AddressPrediction[];
  loading: boolean;
  fetchPredictions: (input: string) => void;
  clearPredictions: () => void;
}

async function fetchAutocompletePredictions(input: string): Promise<AddressPrediction[]> {
  const response = await fetch(`/api/v1/autocomplete?input=${encodeURIComponent(input)}`);
  const result = (await response.json()) as ApiResponse<{ predictions: AddressPrediction[] }>;
  if (!response.ok || !result.success) {
    return [];
  }
  return result.data.predictions || [];
}

export function useAddressAutocomplete(): UseAddressAutocompleteReturn {
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const mutation = useMutation({ mutationFn: fetchAutocompletePredictions });

  const fetchPredictions = (input: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (input.length < 3) {
      mutation.reset();
      return;
    }

    debounceTimer.current = setTimeout(() => {
      mutation.mutate(input);
    }, 300);
  };

  const clearPredictions = () => mutation.reset();

  return {
    predictions: mutation.data ?? [],
    loading: mutation.isPending,
    fetchPredictions,
    clearPredictions,
  };
}
