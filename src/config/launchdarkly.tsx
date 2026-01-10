'use client'

import { asyncWithLDProvider, useFlags, useLDClient, useLDClientError } from 'launchdarkly-react-client-sdk'
import { ReactNode, useEffect, useState } from 'react'

interface LaunchDarklyProviderProps {
  children: ReactNode
}

export function LaunchDarklyProvider({ children }: LaunchDarklyProviderProps) {
  const [LDProvider, setLDProvider] = useState<any>(null)

  useEffect(() => {
    console.log("Attempting to initialiaze Launch Darkly")
    const initLD = async () => {
      const clientSideID = process.env.NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_ID

      if (!clientSideID) {
        console.warn('LaunchDarkly client ID not found. Feature flags will not work.')
        return
      }

      try {
        const provider = await asyncWithLDProvider({
          clientSideID,
          context: {
            kind: 'user',
            key: 'anonymous',
            anonymous: true,
          },
        })
        console.log("LaunchDarkly successfully initialized")
        setLDProvider(() => provider)
      } catch (error) {
        console.error('Failed to initialize LaunchDarkly:', error)
      }
    }

    initLD()
  }, [])

  if (!LDProvider) {
    return <>{children}</>
  }

  return <LDProvider>{children}</LDProvider>
}

export function useLaunchDarkly() {
  const flags = useFlags()
  const ldClient = useLDClient()
  const ldError = useLDClientError()

  return {
    flags,
    hasLdState: Boolean(ldClient) || Boolean(ldError),
    ldError,
  }
}
