import { cache } from 'react'
import LaunchDarkly from 'launchdarkly-node-server-sdk'
import { FeatureFlag, featureFlagDefaults, featureFlagKeys } from '@/lib/feature-flags'

type LdClient = ReturnType<typeof LaunchDarkly.init>

const sdkKey = process.env.LAUNCH_DARKLY_ENV_SDK_DEV
const ldContext = {
  kind: 'user',
  key: 'anonymous',
  anonymous: true,
} as const

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
    const value = await client.variation(featureFlagKeys[flag], ldContext, fallback)
    return Boolean(value)
  } catch (error) {
    console.error('Failed to evaluate LaunchDarkly flag:', error)
    return fallback
  }
}
