/**
 * @fileoverview Multi-level caching service using IndexedDB.
 * Provides persistent client-side caching for improved performance.
 */

export interface CacheEntry<T> {
    key: string;
    data: T;
    timestamp: number;
}

export class CacheService {
    private static DB_NAME = 'FocuslyCache';
    private static DB_VERSION = 1;
    private static STORE_NAME = 'cache';

    /**
     * Get cached data by key
     */
    static async get<T>(key: string): Promise<T | null> {
        try {
            const db = await this.openDB();
            const tx = db.transaction(this.STORE_NAME, 'readonly');
            const store = tx.objectStore(this.STORE_NAME);

            return new Promise((resolve, reject) => {
                const request = store.get(key);
                request.onsuccess = () => {
                    const entry = request.result as CacheEntry<T> | undefined;
                    resolve(entry?.data || null);
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    /**
     * Set cached data with key
     */
    static async set<T>(key: string, data: T): Promise<void> {
        try {
            const db = await this.openDB();
            const tx = db.transaction(this.STORE_NAME, 'readwrite');
            const store = tx.objectStore(this.STORE_NAME);

            await new Promise<void>((resolve, reject) => {
                const request = store.put({
                    key,
                    data,
                    timestamp: Date.now()
                });
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Cache set error:', error);
        }
    }

    /**
     * Delete cached data by key
     */
    static async delete(key: string): Promise<void> {
        try {
            const db = await this.openDB();
            const tx = db.transaction(this.STORE_NAME, 'readwrite');
            const store = tx.objectStore(this.STORE_NAME);

            await new Promise<void>((resolve, reject) => {
                const request = store.delete(key);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Cache delete error:', error);
        }
    }

    /**
     * Clear all cached data
     */
    static async clear(): Promise<void> {
        try {
            const db = await this.openDB();
            const tx = db.transaction(this.STORE_NAME, 'readwrite');
            const store = tx.objectStore(this.STORE_NAME);

            await new Promise<void>((resolve, reject) => {
                const request = store.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Cache clear error:', error);
        }
    }

    /**
     * Open or create IndexedDB database
     */
    private static openDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    db.createObjectStore(this.STORE_NAME, { keyPath: 'key' });
                }
            };
        });
    }

    /**
     * Check if cache is expired
     */
    static isCacheExpired(timestamp: number, ttl: number): boolean {
        return Date.now() - timestamp > ttl;
    }
}
