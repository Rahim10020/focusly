/**
 * @fileoverview In-memory L1 cache implementation.
 */

import { MemoryCacheEntry } from './cacheTypes';

/**
 * In-memory cache with LRU eviction and TTL support.
 */
export class MemoryCache {
    private static cache = new Map<string, MemoryCacheEntry<unknown>>();
    private static readonly MAX_SIZE = 100;
    private static readonly DEFAULT_TTL = 60000; // 1 minute

    /**
     * Get data from memory cache.
     */
    static get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    /**
     * Set data in memory cache with LRU eviction.
     */
    static set<T>(key: string, data: T, ttl: number): void {
        // LRU: if cache is full, remove oldest entry
        if (this.cache.size >= this.MAX_SIZE) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
                this.cache.delete(firstKey);
            }
        }

        this.cache.set(key, {
            data,
            expiresAt: Date.now() + Math.min(ttl, this.DEFAULT_TTL),
        });
    }

    /**
     * Delete entry from memory cache.
     */
    static delete(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Clear expired entries from memory cache.
     */
    static cleanExpired(): void {
        const now = Date.now();
        const keysToDelete: string[] = [];

        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => this.cache.delete(key));
    }

    /**
     * Get cache size.
     */
    static size(): number {
        return this.cache.size;
    }

    /**
     * Clear all entries.
     */
    static clear(): void {
        this.cache.clear();
    }

    /**
     * Get max size.
     */
    static maxSize(): number {
        return this.MAX_SIZE;
    }
}
