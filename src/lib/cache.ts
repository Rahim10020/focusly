/**
 * @fileoverview Caching utilities for reducing database calls.
 * Provides a Cache class with get/set operations backed by Supabase.
 * @module lib/cache
 */

import { supabase } from './supabase';
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
 *
 * @class Cache
 *
 * @example
 * // Using getOrSet for automatic caching
 * const data = await Cache.getOrSet('user-stats-123', fetchUserStats, { ttl: 300000 });
 *
 * @example
 * // Invalidating cache
 * await Cache.invalidate('user-stats-123');
 * await Cache.invalidatePattern('user-stats');
 */
export class Cache {
    private static sanitizeCacheKey(key: string): string {
        // Permettre uniquement alphanumeric, :, -, _
        const sanitized = key.replace(/[^a-zA-Z0-9:_-]/g, '');
        if (sanitized.length === 0 || sanitized.length > 255) {
            throw new Error('Invalid cache key format');
        }
        return sanitized;
    }

    private static async get<T>(key: string): Promise<T | null> {
        try {
            const sanitizedKey = this.sanitizeCacheKey(key);
            
            const { data, error } = await supabase
                .from('cache')
                .select('data, expires_at')
                .eq('cache_key', sanitizedKey)
                .single();

            if (error && error.code !== 'PGRST116') {
                logger.error('Cache get failed', error, {
                    action: 'cacheGet',
                    key: sanitizedKey
                });
                return null;
            }

            if (!data) return null;

            // Vérifier expiration
            const expiresAt = new Date(data.expires_at).getTime();
            if (Date.now() > expiresAt) {
                // Supprimer entrée expirée
                await this.delete(sanitizedKey);
                return null;
            }

            return data.data as T;
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
            const { error } = await supabase
                .from('cache')
                .delete()
                .eq('cache_key', sanitizedKey);

            if (error) {
                logger.error('Cache delete failed', error, {
                    action: 'cacheDelete',
                    key
                });
                // Optionnel: throw si critique pour l'app
                // throw new Error(`Cache delete failed: ${error.message}`);
            }
        } catch (error) {
            logger.error('Cache delete exception', error as Error, {
                action: 'cacheDelete',
                key
            });
            // Re-throw si l'erreur doit remonter
            throw error;
        }
    }

    private static async set(key: string, data: any, ttl: number): Promise<void> {
        const sanitizedKey = this.sanitizeCacheKey(key);
        try {
            const expiresAt = new Date(Date.now() + ttl);
            const { error } = await supabase
                .from('cache')
                .upsert({
                    cache_key: sanitizedKey,
                    data,
                    expires_at: expiresAt.toISOString()
                }, {
                    onConflict: 'cache_key'
                });

            if (error) {
                logger.error('Cache set failed', error, {
                    action: 'cacheSet',
                    key,
                    ttl
                });
                // Décider si l'app peut continuer sans cache
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

    static async invalidatePattern(pattern: string): Promise<void> {
        try {
            // Use a simple LIKE query to delete matching keys
            await (supabase
                .from('cache') as any)
                .delete()
                .like('cache_key', `%${pattern}%`);
        } catch (error) {
            console.error('Cache invalidate pattern error:', error);
        }
    }
}