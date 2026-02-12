/**
 * @fileoverview Caching utilities for reducing database calls.
 * Provides a multi-level Cache class with in-memory (L1) and Supabase (L2) layers.
 * Supports automatic invalidation patterns for related cache entries.
 * @module lib/cache
 */

import { CacheOptions, CacheStats } from './cache-components/cacheTypes';
import { MemoryCache } from './cache-components/memoryCache';
import { SupabaseCache } from '@/lib/cache-components/supabaseCache';
import { logger } from './logger';
import type { Json } from '@/lib/supabase/database.types';

/**
 * Multi-level cache utility class with L1 (memory) and L2 (Supabase) layers.
 * L1 cache provides fast access with configurable size limit.
 * L2 cache provides persistence across server restarts.
 * Supports automatic invalidation patterns for related cache entries.
 *
 * @class Cache
 *
 * @example
 * // Using getOrSet for automatic caching
 * const data = await Cache.getOrSet('user-stats-123', fetchUserStats, { ttl: 300000 });
 *
 * @example
 * // Register invalidation patterns
 * Cache.registerInvalidation('tasks', ['tasks:*', 'stats:*', 'achievements:*']);
 *
 * @example
 * // Invalidating cache by pattern
 * await Cache.invalidate('user-stats-123');
 * await Cache.invalidatePattern('user-stats');
 */
export class Cache {
    private static invalidationPatterns = new Map<string, Set<string>>();
    private static failureCount = 0;
    private static readonly MAX_FAILURES = 5;
    private static cacheDisabled = false;

    /**
     * Sanitize cache key to prevent injection.
     */
    private static sanitizeCacheKey(key: string): string {
        const sanitized = key.replace(/[^a-zA-Z0-9:_-]/g, '');
        if (sanitized.length === 0 || sanitized.length > 255) {
            throw new Error('Invalid cache key format');
        }
        return sanitized;
    }

    /**
     * Register cache keys that should be invalidated when a pattern is matched.
     * This allows for automatic cascading invalidation of related cache entries.
     *
     * @param pattern - The pattern name to match
     * @param keys - Array of cache key patterns to invalidate
     */
    static registerInvalidation(pattern: string, keys: string[]): void {
        if (!this.invalidationPatterns.has(pattern)) {
            this.invalidationPatterns.set(pattern, new Set());
        }
        keys.forEach(key => this.invalidationPatterns.get(pattern)!.add(key));
    }

    /**
     * Gets data from cache (L1 then L2).
     */
    private static async get<T>(key: string): Promise<T | null> {
        const sanitizedKey = this.sanitizeCacheKey(key);

        // Try L1 (memory) cache first
        const memoryData = MemoryCache.get<T>(sanitizedKey);
        if (memoryData !== null) {
            return memoryData;
        }

        // Try L2 (Supabase) cache
        const supabaseData = await SupabaseCache.get<T>(sanitizedKey);
        if (supabaseData !== null) {
            // Store in L1 cache for faster subsequent access
            const expiresAt = Date.now() + 60000; // 1 minute default
            MemoryCache.set(sanitizedKey, supabaseData, expiresAt - Date.now());
            return supabaseData;
        }

        return null;
    }

    /**
     * Sets data in cache (L1 and optionally L2).
     */
    private static async set(key: string, value: Json, ttl: number, memoryOnly = false): Promise<void> {
        const sanitizedKey = this.sanitizeCacheKey(key);

        // Always set in L1 (memory) cache
        MemoryCache.set(sanitizedKey, value, ttl);

        // Set in L2 (Supabase) cache unless memoryOnly is true
        if (!memoryOnly) {
            await SupabaseCache.set(sanitizedKey, value, ttl);
        }
    }

    /**
     * Deletes data from cache (L1 and L2).
     */
    private static async delete(key: string): Promise<void> {
        const sanitizedKey = this.sanitizeCacheKey(key);

        // Delete from L1 cache
        MemoryCache.delete(sanitizedKey);

        // Delete from L2 cache
        await SupabaseCache.delete(sanitizedKey);
    }

    /**
     * Get or set data in cache with automatic fetch.
     */
    static async getOrSet<T>(
        key: string,
        fetcher: () => Promise<T>,
        options: CacheOptions = { ttl: 5 * 60 * 1000 } // 5 minutes default
    ): Promise<T> {
        if (this.cacheDisabled) {
            logger.warn('Cache disabled due to repeated failures', {
                action: 'cacheGetOrSet',
                key
            });
            return fetcher();
        }

        // Periodic cleanup of expired memory cache entries
        if (Math.random() < 0.1) { // 10% chance on each call
            MemoryCache.cleanExpired();
        }

        try {
            const cached = await this.get<T>(key);
            if (cached !== null) {
                this.failureCount = 0; // Reset on success
                return cached;
            }

            const data = await fetcher();
            await this.set(key, data as Json, options.ttl || 300000, options.memoryOnly);
            return data;
        } catch (error) {
            this.failureCount++;
            if (this.failureCount >= this.MAX_FAILURES) {
                this.cacheDisabled = true;
                logger.error('Cache circuit breaker triggered', error as Error, {
                    action: 'cacheCircuitBreaker',
                    failureCount: this.failureCount
                });
            }
            return fetcher(); // Fallback sans cache
        }
    }

    /**
     * Invalidate a specific cache entry.
     */
    static async invalidate(key: string): Promise<void> {
        await this.delete(key);
    }

    /**
     * Get cache statistics for monitoring.
     */
    static getStats(): CacheStats {
        return {
            memorySize: MemoryCache.size(),
            maxMemorySize: MemoryCache.maxSize(),
            failureCount: this.failureCount,
            isDisabled: this.cacheDisabled,
        };
    }

    /**
     * Invalidate all cache keys matching a pattern and registered dependent patterns.
     *
     * @param pattern - Pattern to match and invalidate
     */
    static async invalidatePattern(pattern: string): Promise<void> {
        try {
            // Get registered patterns to invalidate
            const patternsToInvalidate = this.invalidationPatterns.get(pattern);

            if (patternsToInvalidate) {
                // Invalidate all registered patterns
                await Promise.all(
                    Array.from(patternsToInvalidate).map(async (pat) => {
                        const count = await SupabaseCache.deleteByPattern(pat);
                        logger.info('Invalidated pattern', {
                            action: 'invalidatePattern',
                            pattern: pat,
                            keysDeleted: count
                        });
                    })
                );

                logger.info('Invalidated pattern with dependencies', {
                    action: 'invalidatePattern',
                    pattern,
                    dependentPatterns: Array.from(patternsToInvalidate)
                });
            }

            // Also invalidate the pattern itself
            const count = await SupabaseCache.deleteByPattern(pattern);
            logger.info('Pattern invalidated', {
                action: 'invalidatePattern',
                pattern,
                keysInvalidated: count
            });
        } catch (error) {
            logger.error('Cache invalidate pattern error', error as Error, {
                action: 'invalidatePattern',
                pattern
            });
        }
    }

    /**
     * Clear all expired cache entries from L2 (Supabase).
     * Should be called periodically (e.g., via a cron job).
     * L1 cache is cleaned automatically on access.
     */
    static async clearExpired(): Promise<void> {
        await SupabaseCache.clearExpired();
    }
}
