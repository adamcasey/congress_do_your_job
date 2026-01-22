import { cache } from 'react'
import { headers } from 'next/headers'
import LaunchDarkly from 'launchdarkly-node-server-sdk'
import { FeatureFlag, featureFlagDefaults, featureFlagKeys } from '@/lib/feature-flags'

type LdClient = ReturnType<typeof LaunchDarkly.init>

const sdkKey = process.env.LAUNCH_DARKLY_ENV_SDK_DEV

/**
 * Get the user's IP address from request headers
 * Checks common headers used by proxies/load balancers
 */
async function getClientIp(): Promise<string | undefined> {
  const headersList = await headers()

  // Check common headers in order of preference
  const xForwardedFor = headersList.get('x-forwarded-for')
  if (xForwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return xForwardedFor.split(',')[0].trim()
  }

  const xRealIp = headersList.get('x-real-ip')
  if (xRealIp) {
    return xRealIp
  }

  // Vercel-specific header
  const vercelForwardedFor = headersList.get('x-vercel-forwarded-for')
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(',')[0].trim()
  }

  return undefined
}

/**
 * Build LaunchDarkly context with user IP for targeting
 */
async function buildLdContext() {
  const ip = await getClientIp()

  return {
    kind: 'user',
    key: 'anonymous',
    anonymous: true,
    ip,
  }
}

let clientInstance: LdClient | null = null
let initializationPromise: Promise<LdClient | null> | null = null

const getClient = cache(async (): Promise<LdClient | null> => {
  if (!sdkKey) {
    console.warn('LaunchDarkly SDK key not found. Falling back to defaults.')
    return null
  }

  if (clientInstance) {
    return clientInstance
  }

  if (initializationPromise) {
    return initializationPromise
  }

  initializationPromise = (async () => {
    try {
      const client = LaunchDarkly.init(sdkKey)
      await client.waitForInitialization()
      clientInstance = client
      return client
    } catch (error) {
      console.error('Failed to initialize LaunchDarkly server client:', error)
      initializationPromise = null
      return null
    }
  })()

  return initializationPromise
})

export async function getServerFlag(flag: FeatureFlag): Promise<boolean> {
  const fallback = featureFlagDefaults[flag]
  const client = await getClient()

  if (!client) {
    return fallback
  }

  try {
    const context = await buildLdContext()
    const value = await client.variation(featureFlagKeys[flag], context, fallback)
    return Boolean(value)
  } catch (error) {
    console.error('Failed to evaluate LaunchDarkly flag:', error)
    return fallback
  }
}
