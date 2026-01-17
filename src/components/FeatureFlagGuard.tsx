import { redirect } from 'next/navigation'
import { ReactNode } from 'react'
import { FeatureFlag } from '@/lib/feature-flags'
import { getServerFlag } from '@/lib/launchdarkly-server'

type FeatureFlagGuardProps = {
  children: ReactNode
  flag: FeatureFlag
  redirectTo?: string
  invert?: boolean
}

/**
 * Server component that guards content behind a feature flag
 * @param flag - The feature flag to check
 * @param redirectTo - Where to redirect if flag check fails (default: /coming-soon)
 * @param invert - If true, redirect when flag is false instead of true
 */
export async function FeatureFlagGuard({
  children,
  flag,
  redirectTo = '/coming-soon',
  invert = false,
}: FeatureFlagGuardProps) {
  const flagValue = await getServerFlag(flag)
  const shouldRedirect = invert ? !flagValue : flagValue

  if (shouldRedirect) {
    redirect(redirectTo)
  }

  return <>{children}</>
}
