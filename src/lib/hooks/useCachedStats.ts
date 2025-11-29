/**
 * @fileoverview Custom hook for caching statistics to reduce API calls.
 * @module lib/hooks/useCachedStats
 */

import { useState, useEffect } from 'react';
import { useStats } from './useStats';

const CACHE_DURATION = 30000; // 30 secondes

/**
 * Hook that caches statistics for a specified duration to reduce API calls.
 * The cache is automatically invalidated after CACHE_DURATION or can be manually invalidated.
 * 
 * @returns {Object} Contains cached stats, all stats hook methods, and invalidateCache function
 */
export const useCachedStats = () => {
    const [cachedStats, setCachedStats] = useState<any>(null);
    const [cacheTimestamp, setCacheTimestamp] = useState(0);

    const { stats, ...statsHook } = useStats();

    useEffect(() => {
        const now = Date.now();

        // Utiliser le cache si valide
        if (cachedStats && (now - cacheTimestamp < CACHE_DURATION)) {
            return;
        }

        // Sinon mettre à jour le cache
        if (stats) {
            setCachedStats(stats);
            setCacheTimestamp(now);
        }
    }, [stats, cachedStats, cacheTimestamp]);

    /**
     * Manually invalidate the cache to force a refresh of statistics
     */
    const invalidateCache = () => {
        setCacheTimestamp(0);
    };

    return {
        stats: cachedStats || stats,
        ...statsHook,
        invalidateCache
    };
};
