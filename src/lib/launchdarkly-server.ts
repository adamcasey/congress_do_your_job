import { cache } from 'react'
import { headers } from 'next/headers'
import LaunchDarkly from 'launchdarkly-node-server-sdk'
import { FeatureFlag, featureFlagDefaults, featureFlagKeys } from '@/lib/feature-flags'

type LdClient = ReturnType<typeof LaunchDarkly.init>

// Use production SDK key in production, dev key in development
const sdkKey = process.env.LAUNCH_DARKLY_ENV_SDK || process.env.LAUNCH_DARKLY_ENV_SDK_DEV

// Log SDK key configuration at startup
console.log('[LaunchDarkly] SDK Key Configuration:', {
  hasProductionKey: !!process.env.LAUNCH_DARKLY_ENV_SDK,
  hasDevKey: !!process.env.LAUNCH_DARKLY_ENV_SDK_DEV,
  usingSdkKey: sdkKey ? `${sdkKey.substring(0, 8)}...` : 'NONE',
  nodeEnv: process.env.NODE_ENV,
})

/**
 * Get the user's IP address from request headers
 * Checks common headers used by proxies/load balancers
 */
async function getClientIp(): Promise<string | undefined> {
  const headersList = await headers()

  // Check common headers in order of preference
  const xForwardedFor = headersList.get('x-forwarded-for')
  const xRealIp = headersList.get('x-real-ip')
  const vercelForwardedFor = headersList.get('x-vercel-forwarded-for')

  /*
  Keep LaunchDarkly debugging log statements in case you need them again int eh future
  */
  // console.log('[LaunchDarkly] IP Detection Headers:', {
  //   'x-forwarded-for': xForwardedFor || 'not set',
  //   'x-real-ip': xRealIp || 'not set',
  //   'x-vercel-forwarded-for': vercelForwardedFor || 'not set',
  // })

  if (xForwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    const ip = xForwardedFor.split(',')[0].trim()
    // console.log('[LaunchDarkly] Using IP from x-forwarded-for:', ip)
    return ip
  }

  if (xRealIp) {
    // console.log('[LaunchDarkly] Using IP from x-real-ip:', xRealIp)
    return xRealIp
  }

  // Vercel-specific header
  if (vercelForwardedFor) {
    const ip = vercelForwardedFor.split(',')[0].trim()
    // console.log('[LaunchDarkly] Using IP from x-vercel-forwarded-for:', ip)
    return ip
  }

  console.warn('[LaunchDarkly] No IP address found in request headers')
  return undefined
}

/**
 * Build LaunchDarkly context with user IP for targeting
 */
async function buildLdContext() {
  const ip = await getClientIp()

  const context = {
    kind: 'user',
    key: 'anonymous',
    anonymous: true,
    ip,
  }

  // Keep for debugging 
  // console.log('[LaunchDarkly] Built context:', JSON.stringify(context, null, 2))

  return context
}

let clientInstance: LdClient | null = null
let initializationPromise: Promise<LdClient | null> | null = null

const getClient = cache(async (): Promise<LdClient | null> => {
  if (!sdkKey) {
    console.warn('[LaunchDarkly] SDK key not found. Falling back to defaults.')
    return null
  }

  if (clientInstance) {
    console.log('[LaunchDarkly] Reusing existing client instance')
    return clientInstance
  }

  if (initializationPromise) {
    console.log('[LaunchDarkly] Waiting for existing initialization promise')
    return initializationPromise
  }

  console.log('[LaunchDarkly] Initializing new client...')
  initializationPromise = (async () => {
    try {
      const client = LaunchDarkly.init(sdkKey)
      console.log('[LaunchDarkly] Client created, waiting for initialization...')
      await client.waitForInitialization()
      console.log('[LaunchDarkly] Client successfully initialized')
      clientInstance = client
      return client
    } catch (error) {
      console.error('[LaunchDarkly] Failed to initialize server client:', error)
      initializationPromise = null
      return null
    }
  })()

  return initializationPromise
})

export async function getServerFlag(flag: FeatureFlag): Promise<boolean> {
  const fallback = featureFlagDefaults[flag]
  const flagKey = featureFlagKeys[flag]

  console.log(`[LaunchDarkly] Evaluating flag "${flag}" (key: ${flagKey})`)

  const client = await getClient()

  if (!client) {
    console.warn(`[LaunchDarkly] No client available, returning fallback for "${flag}":`, fallback)
    return fallback
  }

  try {
    const context = await buildLdContext()
    const value = await client.variation(flagKey, context, fallback)
    console.log(`[LaunchDarkly] Flag "${flag}" evaluated to:`, value, '(fallback was:', fallback + ')')
    return Boolean(value)
  } catch (error) {
    console.error(`[LaunchDarkly] Failed to evaluate flag "${flag}":`, error)
    return fallback
  }
}
