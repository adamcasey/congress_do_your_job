/**
 * Environment detection and configuration
 */

export const ENV = {
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
} as const;

/**
 * Get environment-specific value
 * Automatically selects based on NODE_ENV
 */
export function getEnvValue<T>(config: { development: T; production: T; test?: T }): T {
  if (ENV.isTest && config.test) return config.test;
  if (ENV.isProduction) return config.production;
  return config.development;
}
