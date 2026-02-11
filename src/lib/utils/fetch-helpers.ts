/**
 * @fileoverview Data fetching utilities for React hooks.
 * Provides standardized patterns for async data loading with retry logic.
 * @module lib/utils/fetch-helpers
 */

import { useState, useEffect, useCallback } from 'react';
import { logger } from '../logger';
import { retryWithBackoff } from './retry';
import { HookResult } from './error-helpers';

/**
 * Standard pattern for data fetching hooks.
 * Provides loading, error, and refetch capabilities.
 *
 * @template T - The data type being fetched
 * @param fetchFn - The function to fetch data
 * @param dependencies - Dependencies that trigger refetch
 * @returns Hook result with data, loading, error, and refetch
 *
 * @example
 * function useTasks() {
 *   return useDataFetching(
 *     async () => {
 *       const { data, error } = await supabase.from('tasks').select('*');
 *       if (error) throw error;
 *       return data;
 *     },
 *     [userId]
 *   );
 * }
 */
export function useDataFetching<T>(
    fetchFn: () => Promise<T>,
    dependencies: unknown[] = []
): HookResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await retryWithBackoff(fetchFn, {
                maxRetries: 3,
                onRetry: (attempt, err, delay) => {
                    logger.warn(`Retrying fetch attempt ${attempt}`, {
                        error: err instanceof Error ? err.message : String(err),
                        delay
                    });
                }
            });
            setData(result);
        } catch (err) {
            const error = err as Error;
            setError(error.message);
            logger.error('Data fetching failed', error, {
                action: 'useDataFetching'
            });
        } finally {
            setLoading(false);
        }
    }, [fetchFn]);

    useEffect(() => {
        fetch();
    }, [fetch, dependencies]);

    return {
        data,
        loading,
        error,
        refetch: fetch
    };
}

/**
 * Creates a fetch hook with immediate data availability check.
 * Useful for SSR/hydration scenarios.
 *
 * @template T - The data type
 * @param initialData - Initial data to use while loading
 * @returns Hook with data and setData methods
 */
export function useFetchWithInitial<T>(
    initialData: T | null = null
) {
    const [data, setData] = useState<T | null>(initialData);
    const loading = data === null;

    return {
        data,
        setData,
        loading,
        isEmpty: data === null || (Array.isArray(data) && data.length === 0)
    };
}

/**
 * Polls data at a specified interval.
 *
 * @template T - The data type
 * @param fetchFn - The function to fetch data
 * @param interval - Polling interval in milliseconds
 * @param enabled - Whether polling is enabled
 * @returns Hook result with data, loading, error
 */
export function usePolling<T>(
    fetchFn: () => Promise<T>,
    interval: number,
    enabled: boolean = true
): HookResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const result = await fetchFn();
            setData(result);
            setError(null);
        } catch (err) {
            const error = err as Error;
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [fetchFn]);

    useEffect(() => {
        if (!enabled) return;

        fetchData();
        const id = setInterval(fetchData, interval);

        return () => clearInterval(id);
    }, [fetchData, interval, enabled]);

    return { data, loading, error };
}
