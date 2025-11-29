/**
 * @fileoverview Caching utilities for reducing database calls.
 * Provides a Cache class with get/set operations backed by Supabase.
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
}

/**
 * Cache utility class for storing and retrieving data with TTL support.
 * Uses Supabase as the backing store for persistence.
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

    private static sanitizeCacheKey(key: string): string {
        // Permettre uniquement alphanumeric, :, -, _
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
            const { data, error } = await (supabaseServerPool.getAdminClient().from('cache') as any)
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

            const { data, error } = await (supabaseServerPool.getAdminClient().from('cache') as any)
                .select('cache_value, expires_at')
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

            return (data as any).cache_value as T;
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
        try {
            const { error } = await supabaseServerPool.getAdminClient()
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

    private static async set(key: string, data: any, ttl: number): Promise<void> {
        const sanitizedKey = this.sanitizeCacheKey(key);
        try {
            const expiresAt = new Date(Date.now() + ttl);
            const { error } = await (supabaseServerPool.getAdminClient().from('cache') as any)
                .upsert({
                    cache_key: sanitizedKey,
                    cache_value: data,
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

        try {
            const cached = await this.get<T>(key);
            if (cached !== null) {
                this.cacheFailureCount = 0; // Reset on success
                return cached;
            }

            const data = await fetcher();
            await this.set(key, data, options.ttl || 300000);
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
     * Clear all expired cache entries.
     * Should be called periodically (e.g., via a cron job).
     */
    static async clearExpired(): Promise<void> {
        try {
            const { error } = await supabaseServerPool.getAdminClient()
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