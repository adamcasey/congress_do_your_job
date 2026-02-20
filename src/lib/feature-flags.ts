/**
 * LaunchDarkly Feature Flags
 *
 * Enum values match the exact flag keys in LaunchDarkly dashboard (kebab-case)
 */
export enum FeatureFlag {
  /**
   * Controls whether homepage redirects to /coming-soon
   */
  COMING_SOON_LANDING_PAGE = 'coming-soon-landing-page',

  /**
   * Controls whether the budget bill timer is displayed
   */
  BUDGET_BILL_TIMER = 'budget-bill-timer',
}

/**
 * Type-safe flag defaults
 * Used as fallback when LaunchDarkly is unavailable
 */
export const featureFlagDefaults: Record<FeatureFlag, boolean> = {
  [FeatureFlag.COMING_SOON_LANDING_PAGE]: true,
  [FeatureFlag.BUDGET_BILL_TIMER]: false,
}
