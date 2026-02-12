import type { MemoryCacheEntry } from './cacheTypes';

const MAX_ENTRIES = 1000;

export class MemoryCache {
    private static store = new Map<string, MemoryCacheEntry<unknown>>();

    static get<T>(key: string): T | null {
        const entry = this.store.get(key);
        if (!entry) {
            return null;
        }

        if (entry.expiresAt <= Date.now()) {
            this.store.delete(key);
            return null;
        }

        return entry.data as T;
    }

    static set(key: string, value: unknown, ttl: number): void {
        if (this.store.size >= MAX_ENTRIES) {
            const oldestKey = this.store.keys().next().value;
            if (oldestKey) {
                this.store.delete(oldestKey);
            }
        }

        this.store.set(key, {
            data: value,
            expiresAt: Date.now() + ttl,
        });
    }

    static delete(key: string): void {
        this.store.delete(key);
    }

    static cleanExpired(): void {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            if (entry.expiresAt <= now) {
                this.store.delete(key);
            }
        }
    }

    static size(): number {
        return this.store.size;
    }

    static maxSize(): number {
        return MAX_ENTRIES;
    }
}
