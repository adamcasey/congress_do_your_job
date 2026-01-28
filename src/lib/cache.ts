import { getRedisClient, CacheTTL } from '@/config'
import { CacheStatus, CacheMetadata, CachedData, CacheResponse } from '@/types/cache'

/**
 * Generate cache key with namespace and version
 */
export function buildCacheKey(
  service: string,
  resource: string,
  identifier: string,
  version = 'v1'
): string {
  return `${service}:${resource}:${identifier}:${version}`
}

/**
 * Get data from cache with stale-while-revalidate support
 */
export async function getCached<T>(key: string): Promise<CacheResponse<T>> {
  const client = getRedisClient()

  if (!client) {
    return {
      data: null,
      status: CacheStatus.MISS,
      isStale: false,
    }
  }

  try {
    const cached = await client.get<CachedData<T>>(key)

    if (!cached) {
      logCacheEvent('miss', key)
      return {
        data: null,
        status: CacheStatus.MISS,
        isStale: false,
      }
    }

    const age = Math.floor(Date.now() / 1000) - cached.metadata.cachedAt
    const isExpired = age > cached.metadata.ttl

    if (isExpired) {
      const isStale = age > cached.metadata.ttl * 2

      logCacheEvent('stale', key, { age, ttl: cached.metadata.ttl })

      return {
        data: cached.data,
        status: CacheStatus.STALE,
        isStale,
        age,
      }
    }

    logCacheEvent('hit', key, { age })

    return {
      data: cached.data,
      status: CacheStatus.HIT,
      isStale: false,
      age,
    }
  } catch (error) {
    console.error('[Cache] Error reading from cache:', error)
    logCacheEvent('error', key, { error })

    return {
      data: null,
      status: CacheStatus.ERROR,
      isStale: false,
    }
  }
}

/**
 * Set data in cache with metadata
 */
export async function setCached<T>(
  key: string,
  data: T,
  ttl: number,
  version = 'v1'
): Promise<boolean> {
  const client = getRedisClient()

  if (!client) {
    return false
  }

  try {
    const cachedData: CachedData<T> = {
      data,
      metadata: {
        cachedAt: Math.floor(Date.now() / 1000),
        ttl,
        version,
      },
    }

    await client.set(key, cachedData, { ex: ttl * 2 }) // Store for 2x TTL to enable stale serving

    logCacheEvent('set', key, { ttl })

    return true
  } catch (error) {
    console.error('[Cache] Error writing to cache:', error)
    logCacheEvent('error', key, { error })

    return false
  }
}

/**
 * Invalidate cache by key
 */
export async function invalidateCache(key: string): Promise<boolean> {
  const client = getRedisClient()

  if (!client) {
    return false
  }

  try {
    await client.del(key)
    logCacheEvent('invalidate', key)
    return true
  } catch (error) {
    console.error('[Cache] Error invalidating cache:', error)
    return false
  }
}

/**
 * Stale-while-revalidate pattern:
 * 1. Try to get from cache
 * 2. If stale, serve stale data immediately
 * 3. Trigger background refresh
 * 4. Next request gets fresh data
 */
export async function getOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number,
  version = 'v1'
): Promise<CacheResponse<T>> {
  const cached = await getCached<T>(key)

  // Cache hit - return immediately
  if (cached.status === CacheStatus.HIT) {
    return cached
  }

  // Cache miss - fetch fresh data
  if (cached.status === CacheStatus.MISS || cached.status === CacheStatus.ERROR) {
    try {
      const freshData = await fetcher()
      await setCached(key, freshData, ttl, version)

      return {
        data: freshData,
        status: CacheStatus.MISS,
        isStale: false,
      }
    } catch (error) {
      console.error('[Cache] Error fetching fresh data:', error)

      // If we have stale data, return it as fallback
      if (cached.data) {
        return {
          data: cached.data,
          status: CacheStatus.STALE,
          isStale: true,
        }
      }

      throw error
    }
  }

  // Stale data - serve stale and trigger background refresh
  if (cached.status === CacheStatus.STALE && cached.data) {
    // Don't await - let refresh happen in background
    fetcher()
      .then((freshData) => setCached(key, freshData, ttl, version))
      .catch((error) => console.error('[Cache] Background refresh failed:', error))

    return cached
  }

  // Fallback: fetch fresh data
  const freshData = await fetcher()
  await setCached(key, freshData, ttl, version)

  return {
    data: freshData,
    status: CacheStatus.MISS,
    isStale: false,
  }
}

/**
 * Log cache events for monitoring
 * TODO: Send to DataDog in production
 */
function logCacheEvent(
  event: 'hit' | 'miss' | 'stale' | 'set' | 'invalidate' | 'error',
  key: string,
  metadata?: Record<string, unknown>
) {
  const logData = {
    event: `cache.${event}`,
    key,
    timestamp: new Date().toISOString(),
    ...metadata,
  }

  console.log('[Cache]', JSON.stringify(logData))
}

/**
 * Helper to hash sensitive identifiers (e.g., addresses)
 */
export async function hashIdentifier(identifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(identifier)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return hashHex.substring(0, 16) // First 16 chars for brevity
}

// Re-export for convenience
export { CacheTTL, CacheStatus }
export type { CacheResponse } from '@/types/cache'
