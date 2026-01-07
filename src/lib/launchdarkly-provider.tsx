'use client'

import { asyncWithLDProvider } from 'launchdarkly-react-client-sdk'
import { ReactNode, useEffect, useState } from 'react'

interface LaunchDarklyProviderProps {
  children: ReactNode
}

export function LaunchDarklyProvider({ children }: LaunchDarklyProviderProps) {
  const [LDProvider, setLDProvider] = useState<any>(null)

  useEffect(() => {
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
