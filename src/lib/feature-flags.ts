/**
 * LaunchDarkly Feature Flags
 *
 * Maps LaunchDarkly flag keys (kebab-case in dashboard) to camelCase for evaluation
 */
export enum FeatureFlag {
  /**
   * Controls whether homepage redirects to /coming-soon
   * LaunchDarkly key: coming-soon-landing-page
   */
  COMING_SOON_LANDING_PAGE = 'comingSoonLandingPage',
}

/**
 * LaunchDarkly flag keys (raw dashboard keys).
 */
export const featureFlagKeys: Record<FeatureFlag, string> = {
  [FeatureFlag.COMING_SOON_LANDING_PAGE]: 'coming-soon-landing-page',
}

/**
 * Type-safe flag defaults
 * Used as fallback when LaunchDarkly is unavailable
 */
export const featureFlagDefaults: Record<FeatureFlag, boolean> = {
  [FeatureFlag.COMING_SOON_LANDING_PAGE]: true,
}
