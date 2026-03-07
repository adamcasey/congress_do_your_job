"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { FeatureFlag } from "@/lib/feature-flags";
import { useLaunchDarkly, useFeatureFlag } from "@/config/launchdarkly";

type FlagGateProps = {
  children: ReactNode;
  flag: FeatureFlag;
  redirectTo?: string;
  invert?: boolean;
};

/**
 * Client component that gates content behind a feature flag
 * @param flag - The feature flag to check
 * @param redirectTo - Where to redirect if flag check fails (default: /coming-soon)
 * @param invert - If true, redirect when flag is false instead of true
 */
export function FlagGate({ children, flag, redirectTo = "/coming-soon", invert = false }: FlagGateProps) {
  const { hasLdState } = useLaunchDarkly();
  const router = useRouter();

  const flagValue = useFeatureFlag(flag);
  const shouldRedirect = invert ? !flagValue : flagValue;

  useEffect(() => {
    if (hasLdState && shouldRedirect) {
      router.push(redirectTo);
    }
  }, [hasLdState, shouldRedirect, redirectTo, router]);

  if (!hasLdState) {
    return null;
  }

  if (shouldRedirect) {
    return null;
  }

  return <>{children}</>;
}
