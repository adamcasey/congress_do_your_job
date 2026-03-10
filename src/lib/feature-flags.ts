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
  COMING_SOON_LANDING_PAGE = "comingSoonLandingPage",

  /**
   * Controls whether the budget bill timer is displayed
   * LaunchDarkly key: budget-bill-timer
   */
  BUDGET_BILL_TIMER = "budgetBillTimer",

  /**
   * Controls whether the header nav links are visible.
   * When false, the sticky header shows only the brand logo.
   * LaunchDarkly key: show-header-nagivation
   */
  SHOW_HEADER_NAVIGATION = "showHeaderNavigation",
}

/**
 * Type-safe flag defaults
 * Used as fallback when LaunchDarkly is unavailable
 */
export const featureFlagDefaults: Record<FeatureFlag, boolean> = {
  [FeatureFlag.COMING_SOON_LANDING_PAGE]: true,
  [FeatureFlag.BUDGET_BILL_TIMER]: false,
  [FeatureFlag.SHOW_HEADER_NAVIGATION]: true,
};
