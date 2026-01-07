import { getEnvValue } from './env'

export const LAUNCHDARKLY_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_ID || '',
  sdkKey: process.env.NEXT_LAUNCH_DARKLY_SDK_KEY || '',
  environment: getEnvValue({
    development: 'dev',
    production: 'production',
  }),
} as const

export const isLaunchDarklyEnabled = !!LAUNCHDARKLY_CONFIG.clientId
