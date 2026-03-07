"use client";

import { withLDProvider, useFlags, useLDClient, useLDClientError } from "launchdarkly-react-client-sdk";
import { ReactNode } from "react";
import { FeatureFlag, featureFlagDefaults } from "@/lib/feature-flags";

const clientSideID = process.env.NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_ID || "";
const isDev = process.env.NODE_ENV === "development";

function LaunchDarklyProviderComponent({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export const LaunchDarklyProvider = clientSideID
  ? withLDProvider({
      clientSideID,
      context: {
        kind: "user",
        key: "anonymous",
        anonymous: true,
      },
      options: {
        bootstrap: "localStorage",
        sendEvents: !isDev,
        streaming: !isDev,
        diagnosticOptOut: isDev,
      },
    })(LaunchDarklyProviderComponent as any)
  : LaunchDarklyProviderComponent;

export function useLaunchDarkly() {
  const flags = useFlags();
  const ldClient = useLDClient();
  const ldError = useLDClientError();

  return {
    flags,
    hasLdState: Boolean(ldClient) || Boolean(ldError),
    ldError,
  };
}

/**
 * Returns the boolean value of a feature flag.
 * Falls back to the flag's default when LaunchDarkly hasn't initialized yet.
 * Must only be called in Client Components.
 */
export function useFeatureFlag(flag: FeatureFlag): boolean {
  const { flags, hasLdState } = useLaunchDarkly();
  return hasLdState && flag in flags ? Boolean(flags[flag]) : featureFlagDefaults[flag];
}
