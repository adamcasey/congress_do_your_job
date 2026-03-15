"use client";

import { withLDProvider, useFlags, useLDClient, useLDClientError } from "launchdarkly-react-client-sdk";
import React, { ReactNode, useEffect } from "react";
import { FeatureFlag, featureFlagDefaults } from "@/lib/feature-flags";

const clientSideID = process.env.NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_ID || "";
const isDev = process.env.NODE_ENV === "development";
const env = process.env.NODE_ENV ?? "unknown";

// Log at module load time (runs once when the module is first imported)
console.log("[LaunchDarkly] Module loaded", {
  env,
  isDev,
  clientSideID: clientSideID
    ? `${clientSideID.slice(0, 8)}...${clientSideID.slice(-4)}`
    : "(not set — NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_ID is missing)",
  clientSideIDLength: clientSideID.length,
  willInitialize: Boolean(clientSideID),
});

function LaunchDarklyProviderComponent({ children }: { children: ReactNode }) {
  useEffect(() => {
    console.log("[LaunchDarkly] Provider mounted (no SDK — clientSideID was empty)");
  }, []);
  return <>{children}</>;
}

function LaunchDarklyProviderWithLogging({ children }: { children: ReactNode }) {
  useEffect(() => {
    console.log("[LaunchDarkly] Provider mounted with SDK", {
      env,
      isDev,
      clientSideID: clientSideID
        ? `${clientSideID.slice(0, 8)}...${clientSideID.slice(-4)}`
        : "(not set)",
      sendEvents: !isDev,
      streaming: !isDev,
      diagnosticOptOut: isDev,
      bootstrap: "localStorage",
    });
    return () => {
      console.log("[LaunchDarkly] Provider unmounted");
    };
  }, []);
  return <>{children}</>;
}

const LDWrapped = clientSideID
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
    })(LaunchDarklyProviderWithLogging as React.ComponentType<{}>)
  : null;

export function LaunchDarklyProvider({ children }: { children: ReactNode }) {
  if (!clientSideID || !LDWrapped) {
    console.warn(
      "[LaunchDarkly] Skipping SDK initialization — NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_ID is not set. " +
        "Feature flags will use default values."
    );
    return <LaunchDarklyProviderComponent>{children}</LaunchDarklyProviderComponent>;
  }
  const Wrapped = LDWrapped as React.ComponentType<{ children: ReactNode }>;
  return <Wrapped>{children}</Wrapped>;
}

export function useLaunchDarkly() {
  const flags = useFlags();
  const ldClient = useLDClient();
  const ldError = useLDClientError();

  useEffect(() => {
    if (ldError) {
      console.error("[LaunchDarkly] Client error", { error: ldError, env });
    }
  }, [ldError]);

  useEffect(() => {
    if (ldClient) {
      console.log("[LaunchDarkly] Client ready", {
        env,
        clientSideID: clientSideID
          ? `${clientSideID.slice(0, 8)}...${clientSideID.slice(-4)}`
          : "(not set)",
        flagCount: Object.keys(flags).length,
        flags,
      });
    }
  }, [ldClient, flags]);

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
