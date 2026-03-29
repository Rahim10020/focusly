/**
 * @fileoverview Cache types and interfaces.
 */

/**
 * Options for cache operations.
 */
export interface CacheOptions {
    /** Time to live in milliseconds before cache expires */
    ttl: number;
    /** Whether to use only in-memory cache (skip L2) */
    memoryOnly?: boolean;
}

/**
 * In-memory cache entry with TTL support.
 */
export interface MemoryCacheEntry<T> {
    data: T;
    expiresAt: number;
}

/**
 * Cache statistics.
 */
export interface CacheStats {
    memorySize: number;
    maxMemorySize: number;
    failureCount: number;
    isDisabled: boolean;
}
