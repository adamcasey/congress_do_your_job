import { Redis } from '@upstash/redis'
import { createLogger } from '@/lib/logger'

const logger = createLogger('Cache')

/**
 * Cache TTL (Time To Live) configurations in seconds
 */
export const CacheTTL = {
  REPRESENTATIVE_LOOKUP: 90 * 24 * 60 * 60, // 90 days
  DISTRICT_DATA: 90 * 24 * 60 * 60, // 90 days - Census data changes infrequently
  LEGISLATOR_PROFILE: 30 * 24 * 60 * 60, // 30 days
  LEGISLATIVE_DATA: 2 * 60 * 60, // 2 hours
  SCORECARD: 6 * 60 * 60, // 6 hours
  SOCIAL_MEDIA: 4 * 60 * 60, // 4 hours
  WEEKLY_DIGEST: 7 * 24 * 60 * 60, // 7 days
  API_ERROR: 5 * 60, // 5 minutes
} as const

let _redisClient: Redis | null = null

/**
 * Get singleton Redis client
 * Uses REST API for serverless compatibility with Vercel
 */
export function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    logger.warn('Upstash Redis credentials not configured. Cache disabled.')
    return null
  }

  if (!_redisClient) {
    _redisClient = new Redis({
      url,
      token,
    })
    logger.info('Redis client initialized')
  }

  return _redisClient
}
