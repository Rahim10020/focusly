/**
 * @fileoverview Supabase L2 cache implementation.
 */

import { supabaseServerPool } from './supabase/server';
import { logger } from './logger';

/**
 * Sanitize cache key to prevent injection.
 */
const sanitizeCacheKey = (key: string): string => {
    const sanitized = key.replace(/[^a-zA-Z0-9:_-]/g, '');
    if (sanitized.length === 0 || sanitized.length > 255) {
        throw new Error('Invalid cache key format');
    }
    return sanitized;
};

/**
 * Supabase-based L2 cache.
 */
export class SupabaseCache {
    /**
     * Get data from Supabase cache.
     */
    static async get<T>(key: string): Promise<T | null> {
        try {
            const sanitizedKey = sanitizeCacheKey(key);
            const client = await supabaseServerPool.getAdminClient();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (client.from('cache') as any)
                .select('data, expires_at')
                .eq('cache_key', sanitizedKey)
                .single();

            if (error && error.code !== 'PGRST116') {
                logger.error('Cache get failed', error as Error, {
                    action: 'supabaseCacheGet',
                    key: sanitizedKey
                });
                return null;
            }

            if (!data) return null;

            const expiresAt = new Date((data as { expires_at: string }).expires_at).getTime();
            if (Date.now() > expiresAt) {
                await this.delete(sanitizedKey);
                return null;
            }

            return (data as { data: T }).data;
        } catch (error) {
            logger.error('Cache get exception', error as Error, {
                action: 'supabaseCacheGet',
                key
            });
            return null;
        }
    }

    /**
     * Set data in Supabase cache.
     */
    static async set(key: string, value: unknown, ttl: number): Promise<void> {
        try {
            const sanitizedKey = sanitizeCacheKey(key);
            const expiresAt = new Date(Date.now() + ttl);

            const client = await supabaseServerPool.getAdminClient();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                    action: 'supabaseCacheSet',
                    key,
                    ttl
                });
            }
        } catch (error) {
            logger.error('Cache set exception', error as Error, {
                action: 'supabaseCacheSet',
                key
            });
            throw error;
        }
    }

    /**
     * Delete data from Supabase cache.
     */
    static async delete(key: string): Promise<void> {
        try {
            const sanitizedKey = sanitizeCacheKey(key);
            const client = await supabaseServerPool.getAdminClient();
            const { error } = await client
                .from('cache')
                .delete()
                .eq('cache_key', sanitizedKey);

            if (error) {
                logger.error('Cache delete failed', error as Error, {
                    action: 'supabaseCacheDelete',
                    key
                });
            }
        } catch (error) {
            logger.error('Cache delete exception', error as Error, {
                action: 'supabaseCacheDelete',
                key
            });
            throw error;
        }
    }

    /**
     * Get keys matching a pattern.
     */
    static async getKeysMatchingPattern(pattern: string): Promise<string[]> {
        try {
            const client = await supabaseServerPool.getAdminClient();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

            return (data as Array<{ cache_key: string }>)?.map((row) => row.cache_key) || [];
        } catch (error) {
            logger.error('Exception fetching keys by pattern', error as Error, {
                action: 'getKeysMatchingPattern',
                pattern
            });
            return [];
        }
    }

    /**
     * Clear expired entries from Supabase cache.
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

    /**
     * Delete keys matching a pattern.
     */
    static async deleteByPattern(pattern: string): Promise<number> {
        try {
            const keys = await this.getKeysMatchingPattern(pattern);
            await Promise.all(keys.map(key => this.delete(key)));
            return keys.length;
        } catch (error) {
            logger.error('Error deleting keys by pattern', error as Error, {
                action: 'deleteByPattern',
                pattern
            });
            return 0;
        }
    }
}
