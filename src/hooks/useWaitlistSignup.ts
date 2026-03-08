import { useMutation } from "@tanstack/react-query";
import type { ApiResponse } from "@/lib/api-response";

interface UseWaitlistSignupReturn {
  loading: boolean;
  success: boolean;
  error: string;
  submitEmail: (email: string) => Promise<void>;
  reset: () => void;
}

async function postWaitlistEmail(email: string): Promise<{ message: string }> {
  const response = await fetch("/api/v1/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const result = (await response.json()) as ApiResponse<{ message: string }>;
  if (!response.ok || !result.success) {
    const errorMessage = !result.success ? result.error : "Something went wrong";
    throw new Error(errorMessage || "Something went wrong");
  }
  return result.data;
}

export function useWaitlistSignup(): UseWaitlistSignupReturn {
  const mutation = useMutation({ mutationFn: postWaitlistEmail });

  return {
    loading: mutation.isPending,
    success: mutation.isSuccess,
    error: mutation.error instanceof Error ? mutation.error.message : mutation.isError ? "Failed to sign up" : "",
    submitEmail: (email: string) => mutation.mutateAsync(email).then(() => undefined),
    reset: mutation.reset,
  };
}
