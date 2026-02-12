/**
 * @fileoverview Supabase-backed L2 cache implementation.
 * Provides persistent cache storage in the `cache` table.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import type { Json } from '@/lib/supabase/database.types';
import { supabaseServerPool } from '@/lib/supabase/server';

interface CacheRow {
    cache_key: string;
    data: Json;
    expires_at: string;
}

const getAdminClient = (): SupabaseClient<Database> => supabaseServerPool.getAdminClient();

/**
 * Supabase L2 cache utilities.
 * NOTE: Server-only. Do not import in client components.
 */
export class SupabaseCache {
    /**
     * Get cached data by key, only if not expired.
     */
    static async get<T>(key: string): Promise<T | null> {
        const supabase = getAdminClient();
        const now = new Date().toISOString();

        const { data, error } = await supabase
            .from('cache')
            .select('data, expires_at')
            .eq('cache_key', key)
            .gt('expires_at', now)
            .maybeSingle();

        if (error || !data) return null;

        return (data as unknown as { data: T }).data;
    }

    /**
     * Set cached data with TTL.
     */
    static async set(key: string, value: Json, ttl: number): Promise<void> {
        const supabase = getAdminClient();
        const expiresAt = new Date(Date.now() + ttl).toISOString();

        await supabase
            .from('cache')
            .upsert({
                cache_key: key,
                data: value,
                expires_at: expiresAt,
            } as CacheRow, { onConflict: 'cache_key' });
    }

    /**
     * Delete cached data by key.
     */
    static async delete(key: string): Promise<void> {
        const supabase = getAdminClient();
        await supabase
            .from('cache')
            .delete()
            .eq('cache_key', key);
    }

    /**
     * Delete cache entries by pattern. Supports `*` wildcards.
     * Returns number of deleted rows (if available).
     */
    static async deleteByPattern(pattern: string): Promise<number> {
        const supabase = getAdminClient();
        const ilikePattern = pattern.replace(/\*/g, '%');

        const { count } = await supabase
            .from('cache')
            .delete({ count: 'exact' })
            .ilike('cache_key', ilikePattern);

        return count ?? 0;
    }

    /**
     * Clear all expired cache entries.
     */
    static async clearExpired(): Promise<void> {
        const supabase = getAdminClient();
        const now = new Date().toISOString();
        await supabase
            .from('cache')
            .delete()
            .lt('expires_at', now);
    }
}
