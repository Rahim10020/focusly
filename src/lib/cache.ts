/**
 * @fileoverview Caching utilities for reducing database calls.
 * Provides a multi-level Cache class with in-memory (L1) and Supabase (L2) layers.
 * Supports automatic invalidation patterns for related cache entries.
 * @module lib/cache
 */

import { supabaseServerPool } from './supabase/server';
import { logger } from './logger';

/**
 * Options for cache operations.
 * @interface CacheOptions
 */
interface CacheOptions {
    /** Time to live in milliseconds before cache expires */
    ttl: number;
    /** Whether to use only in-memory cache (skip L2) */
    memoryOnly?: boolean;
}

/**
 * In-memory cache entry with TTL support.
 */
interface MemoryCacheEntry<T> {
    data: T;
    expiresAt: number;
}

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
    private static memoryCache = new Map<string, MemoryCacheEntry<any>>();
    private static readonly MAX_MEMORY_CACHE_SIZE = 100;
    private static readonly MEMORY_CACHE_TTL = 60000; // 1 minute default for L1

    private static sanitizeCacheKey(key: string): string {
        // Permettre uniquement alphanumeric, :, -, _
        const sanitized = key.replace(/[^a-zA-Z0-9:_-]/g, '');
        if (sanitized.length === 0 || sanitized.length > 255) {
            throw new Error('Invalid cache key format');
        }
        return sanitized;
    }

    /**
     * Gets data from L1 (memory) cache.
     * @private
     */
    private static getFromMemory<T>(key: string): T | null {
        const entry = this.memoryCache.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
            this.memoryCache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    /**
     * Sets data in L1 (memory) cache with LRU eviction.
     * @private
     */
    private static setInMemory<T>(key: string, data: T, ttl: number): void {
        // Implement LRU: if cache is full, remove oldest entry
        if (this.memoryCache.size >= this.MAX_MEMORY_CACHE_SIZE) {
            const firstKey = this.memoryCache.keys().next().value;
            if (firstKey) {
                this.memoryCache.delete(firstKey);
            }
        }

        this.memoryCache.set(key, {
            data,
            expiresAt: Date.now() + Math.min(ttl, this.MEMORY_CACHE_TTL),
        });
    }

    /**
     * Clears expired entries from memory cache.
     */
    private static cleanMemoryCache(): void {
        const now = Date.now();
        const keysToDelete: string[] = [];

        for (const [key, entry] of this.memoryCache.entries()) {
            if (now > entry.expiresAt) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => this.memoryCache.delete(key));
    }

    /**
     * Register cache keys that should be invalidated when a pattern is matched.
     * This allows for automatic cascading invalidation of related cache entries.
     * 
     * @param pattern - The pattern name to match
     * @param keys - Array of cache key patterns to invalidate
     * 
     * @example
     * Cache.registerInvalidation('tasks', ['tasks:*', 'stats:*', 'leaderboard:*']);
     * // When invalidating 'tasks' pattern, all registered patterns will be cleared
     */
    static registerInvalidation(pattern: string, keys: string[]): void {
        if (!this.invalidationPatterns.has(pattern)) {
            this.invalidationPatterns.set(pattern, new Set());
        }
        keys.forEach(key => this.invalidationPatterns.get(pattern)!.add(key));
    }

    /**
     * Get all cache keys matching a pattern.
     * 
     * @param pattern - Pattern to match (supports * wildcard)
     * @returns Array of matching cache keys
     */
    private static async getKeysMatchingPattern(pattern: string): Promise<string[]> {
        try {
            const client = await supabaseServerPool.getAdminClient();
            const { data, error } = await (client.from('cache') as any)
                .select('cache_key')
                .like('cache_key', pattern.replace('*', '%'));

            if (error) {
                logger.error('Error fetching keys by pattern', error as Error, {
                    action: 'getKeysMatchingPattern',
                    pattern
                });
                return [];
            }

            return data?.map((row: any) => row.cache_key) || [];
        } catch (error) {
            logger.error('Exception fetching keys by pattern', error as Error, {
                action: 'getKeysMatchingPattern',
                pattern
            });
            return [];
        }
    }

    private static async get<T>(key: string): Promise<T | null> {
        try {
            const sanitizedKey = this.sanitizeCacheKey(key);

            // Try L1 (memory) cache first
            const memoryData = this.getFromMemory<T>(sanitizedKey);
            if (memoryData !== null) {
                return memoryData;
            }

            // Try L2 (Supabase) cache
            const client = await supabaseServerPool.getAdminClient();
            const { data, error } = await (client.from('cache') as any)
                .select('data, expires_at')
                .eq('cache_key', sanitizedKey)
                .single();

            if (error && error.code !== 'PGRST116') {
                logger.error('Cache get failed', error as Error, {
                    action: 'cacheGet',
                    key: sanitizedKey
                });
                return null;
            }

            if (!data) return null;

            // Vérifier expiration
            const expiresAt = new Date((data as any).expires_at).getTime();
            if (Date.now() > expiresAt) {
                // Supprimer entrée expirée
                await this.delete(sanitizedKey);
                return null;
            }

            // Store in L1 cache for faster subsequent access
            const result = (data as any).data as T;
            this.setInMemory(sanitizedKey, result, expiresAt - Date.now());

            return result;
        } catch (error) {
            logger.error('Cache get exception', error as Error, {
                action: 'cacheGet',
                key
            });
            return null;
        }
    }

    private static async delete(key: string): Promise<void> {
        const sanitizedKey = this.sanitizeCacheKey(key);

        // Delete from L1 cache
        this.memoryCache.delete(sanitizedKey);

        // Delete from L2 cache
        try {
            const client = await supabaseServerPool.getAdminClient();
            const { error } = await client
                .from('cache')
                .delete()
                .eq('cache_key', sanitizedKey);

            if (error) {
                logger.error('Cache delete failed', error as Error, {
                    action: 'cacheDelete',
                    key
                });
            }
        } catch (error) {
            logger.error('Cache delete exception', error as Error, {
                action: 'cacheDelete',
                key
            });
            throw error;
        }
    }

    private static async set(key: string, value: any, ttl: number, memoryOnly: boolean = false): Promise<void> {
        const sanitizedKey = this.sanitizeCacheKey(key);
        const expiresAt = new Date(Date.now() + ttl);

        // Always set in L1 (memory) cache
        this.setInMemory(sanitizedKey, value, ttl);

        // Set in L2 (Supabase) cache unless memoryOnly is true
        if (!memoryOnly) {
            try {
                const client = await supabaseServerPool.getAdminClient();
                const { error } = await (client.from('cache') as any)
                    .upsert({
                        cache_key: sanitizedKey,
                        data: value,
                        expires_at: expiresAt.toISOString()
                    }, {
                        onConflict: 'cache_key'
                    });

                if (error) {
                    logger.error('Cache set failed', error as Error, {
                        action: 'cacheSet',
                        key,
                        ttl
                    });
                }
            } catch (error) {
                logger.error('Cache set exception', error as Error, {
                    action: 'cacheSet',
                    key
                });
                throw error;
            }
        }
    }

    private static cacheFailureCount = 0;
    private static readonly MAX_FAILURES = 5;
    private static cacheDisabled = false;

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
            this.cleanMemoryCache();
        }

        try {
            const cached = await this.get<T>(key);
            if (cached !== null) {
                this.cacheFailureCount = 0; // Reset on success
                return cached;
            }

            const data = await fetcher();
            await this.set(key, data, options.ttl || 300000, options.memoryOnly);
            return data;
        } catch (error) {
            this.cacheFailureCount++;
            if (this.cacheFailureCount >= this.MAX_FAILURES) {
                this.cacheDisabled = true;
                logger.error('Cache circuit breaker triggered', error as Error, {
                    action: 'cacheCircuitBreaker',
                    failureCount: this.cacheFailureCount
                });
            }
            return fetcher(); // Fallback sans cache
        }
    }

    static async invalidate(key: string): Promise<void> {
        await this.delete(key);
    }

    /**
     * Gets cache statistics for monitoring.
     */
    static getStats() {
        return {
            memorySize: this.memoryCache.size,
            maxMemorySize: this.MAX_MEMORY_CACHE_SIZE,
            failureCount: this.cacheFailureCount,
            isDisabled: this.cacheDisabled,
        };
    }

    /**
     * Invalidate all cache keys matching a pattern and registered dependent patterns.
     * 
     * @param pattern - Pattern to match and invalidate
     * 
     * @example
     * // Invalidate all task-related caches
     * await Cache.invalidatePattern('tasks');
     * // This will also invalidate registered patterns like 'stats', 'achievements', etc.
     */
    static async invalidatePattern(pattern: string): Promise<void> {
        try {
            // Get registered patterns to invalidate
            const patternsToInvalidate = this.invalidationPatterns.get(pattern);

            if (patternsToInvalidate) {
                // Invalidate all registered patterns
                await Promise.all(
                    Array.from(patternsToInvalidate).map(async (pat) => {
                        const keys = await this.getKeysMatchingPattern(pat);
                        await Promise.all(keys.map(key => this.delete(key)));
                    })
                );

                logger.info('Invalidated pattern with dependencies', {
                    action: 'invalidatePattern',
                    pattern,
                    dependentPatterns: Array.from(patternsToInvalidate)
                });
            }

            // Also invalidate the pattern itself
            const keys = await this.getKeysMatchingPattern(pattern);
            await Promise.all(keys.map(key => this.delete(key)));

            logger.info('Pattern invalidated', {
                action: 'invalidatePattern',
                pattern,
                keysInvalidated: keys.length
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
        try {
            const client = await supabaseServerPool.getAdminClient();
            const { error } = await client
                .from('cache')
                .delete()
                .lt('expires_at', new Date().toISOString());

            if (error) {
                logger.error('Failed to clear expired cache', error as Error, {
                    action: 'clearExpired'
                });
            } else {
                logger.info('Expired cache cleared', {
                    action: 'clearExpired'
                });
            }
        } catch (error) {
            logger.error('Exception clearing expired cache', error as Error, {
                action: 'clearExpired'
            });
        }
    }
}