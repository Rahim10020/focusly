import { supabase } from './supabase';

interface CacheOptions {
    ttl: number; // Time to live in milliseconds
}

export class Cache {
    private static async get(key: string): Promise<any | null> {
        try {
            const { data, error } = await supabase
                .from('cache')
                .select('data')
                .eq('cache_key', key)
                .gt('expires_at', new Date().toISOString())
                .single();

            if (error || !data) return null;

            return data.data;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    private static async set(key: string, data: any, ttl: number): Promise<void> {
        try {
            const expiresAt = new Date(Date.now() + ttl);

            await supabase
                .from('cache')
                .upsert({
                    cache_key: key,
                    data,
                    expires_at: expiresAt.toISOString()
                }, {
                    onConflict: 'cache_key'
                });
        } catch (error) {
            console.error('Cache set error:', error);
        }
    }

    private static async delete(key: string): Promise<void> {
        try {
            await supabase
                .from('cache')
                .delete()
                .eq('cache_key', key);
        } catch (error) {
            console.error('Cache delete error:', error);
        }
    }

    static async getOrSet<T>(
        key: string,
        fetcher: () => Promise<T>,
        options: CacheOptions = { ttl: 5 * 60 * 1000 } // 5 minutes default
    ): Promise<T> {
        // Try to get from cache
        const cached = await this.get(key);
        if (cached !== null) {
            return cached;
        }

        // Fetch fresh data
        const data = await fetcher();

        // Cache the result
        await this.set(key, data, options.ttl);

        return data;
    }

    static async invalidate(key: string): Promise<void> {
        await this.delete(key);
    }

    static async invalidatePattern(pattern: string): Promise<void> {
        try {
            // Use a simple LIKE query to delete matching keys
            await supabase
                .from('cache')
                .delete()
                .like('cache_key', `%${pattern}%`);
        } catch (error) {
            console.error('Cache invalidate pattern error:', error);
        }
    }
}