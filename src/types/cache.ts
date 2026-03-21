/**
 * Cache type definitions
 */

export enum CacheStatus {
  HIT = "hit",
  MISS = "miss",
  STALE = "stale",
  ERROR = "error",
}

export interface CacheMetadata {
  cachedAt: number; // Unix timestamp
  ttl: number; // Original TTL in seconds
  version: string; // Cache key version
}

export interface CachedData<T> {
  data: T;
  metadata: CacheMetadata;
}

export interface CacheResponse<T> {
  data: T | null;
  status: CacheStatus;
  isStale: boolean;
  age?: number; // Age in seconds
}
