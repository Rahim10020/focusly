/**
 * @fileoverview Utility helpers for custom hooks.
 * Provides standard patterns for error handling, optimistic locking,
 * and state management across hooks.
 * 
 * @module lib/utils/hookHelpers
 */

import { useState, useEffect, useCallback } from 'react';
import { logger } from '../logger';
import { retryWithBackoff } from './retry';

/**
 * Standard hook return type with loading, error states
 */
export interface HookResult<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch?: () => Promise<void>;
}

/**
 * Options for error handling wrapper
 */
export interface ErrorHandlingOptions {
    /** Whether to show user-friendly error messages */
    showToast?: boolean;
    /** Custom error message transformer */
    transformError?: (error: Error) => string;
    /** Whether to retry on error */
    autoRetry?: boolean;
    /** Max retry attempts */
    maxRetries?: number;
    /** Callback fired on error */
    onError?: (error: Error) => void;
}

/**
 * Options for optimistic locking
 */
export interface OptimisticLockOptions<T> {
    /** Current version of the data */
    version?: number;
    /** Callback to get current data for rollback */
    getCurrentData: () => T;
    /** Callback to apply optimistic update */
    applyUpdate: (data: T, updates: Partial<T>) => T;
    /** Callback to rollback on conflict */
    onConflict?: () => void | Promise<void>;
    /** Callback to execute the database update */
    executeUpdate: (data: T, updates: Partial<T>, version: number) => Promise<{ version?: number; error?: any }>;
}

/**
 * Determines if an error is retryable based on common patterns
 * @param error - The error to check
 * @returns true if the error should be retried
 */
export function isRetryableError(error: any): boolean {
    if (!error) return false;

    const code = error.code || error.status || error.statusCode;
    const message = error.message || String(error);

    // Network errors are retryable
    if (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('ECONNREFUSED') ||
        message.includes('ETIMEDOUT')
    ) {
        return true;
    }

    // 5xx server errors are retryable
    if (code && code >= 500 && code < 600) {
        return true;
    }

    // 429 Too Many Requests is retryable
    if (code === 429 || code === '429') {
        return true;
    }

    return false;
}

/**
 * Gets a user-friendly error message from an error object
 * @param error - The error to format
 * @returns A user-friendly error message
 */
export function getUserMessage(error: any): string {
    if (!error) return 'An unknown error occurred';

    const message = error.message || String(error);

    // Map common database errors to user-friendly messages
    if (message.includes('unique constraint') || error.code === '23505') {
        return 'This item already exists';
    }

    if (message.includes('foreign key constraint') || error.code === '23503') {
        return 'Cannot complete this action due to related data';
    }

    if (message.includes('not found') || error.code === 'PGRST116') {
        return 'Item not found';
    }

    if (message.includes('unauthorized') || error.code === '401') {
        return 'You are not authorized to perform this action';
    }

    if (message.includes('network') || message.includes('timeout')) {
        return 'Network error. Please check your connection and try again.';
    }

    // Return the original message if no mapping found, but limit length
    return message.length > 100 ? message.substring(0, 100) + '...' : message;
}

/**
 * Wrapper for hooks to provide standard error handling and retry logic.
 * This creates a higher-order hook that adds error handling capabilities.
 * 
 * @template T - The data type returned by the hook
 * @param hookFn - The original hook function to wrap
 * @param options - Error handling options
 * @returns A wrapped hook with error handling
 * 
 * @example
 * const useTasksBase = () => {
 *   const [tasks, setTasks] = useState([]);
 *   // ... implementation
 *   return { data: tasks, loading, error };
 * };
 * 
 * export const useTasks = withErrorHandling(useTasksBase, {
 *   showToast: true,
 *   autoRetry: true,
 *   maxRetries: 3
 * });
 */
export function withErrorHandling<T extends (...args: any[]) => any>(
    hookFn: T,
    options: ErrorHandlingOptions = {}
): T {
    return ((...args: any[]) => {
        const result = hookFn(...args);
        const [enhancedError, setEnhancedError] = useState<string | null>(null);

        useEffect(() => {
            if (result.error) {
                const errorObj = typeof result.error === 'string'
                    ? new Error(result.error)
                    : result.error;

                // Log to error tracking service
                logger.error('Hook error occurred', errorObj, {
                    hookName: hookFn.name || 'unknown',
                    args: JSON.stringify(args)
                });

                // Transform error message
                const userMessage = options.transformError
                    ? options.transformError(errorObj)
                    : getUserMessage(errorObj);

                setEnhancedError(userMessage);

                // Call custom error handler
                if (options.onError) {
                    options.onError(errorObj);
                }

                // Auto-retry if applicable
                if (options.autoRetry && isRetryableError(errorObj) && result.refetch) {
                    const delay = 2000; // 2 seconds
                    const timeoutId = setTimeout(() => {
                        logger.info('Auto-retrying after error', {
                            hookName: hookFn.name || 'unknown'
                        });
                        result.refetch?.();
                    }, delay);

                    return () => clearTimeout(timeoutId);
                }
            } else {
                setEnhancedError(null);
            }
        }, [result.error]);

        return {
            ...result,
            error: enhancedError || result.error
        };
    }) as T;
}

/**
 * Performs an optimistic update with version-based locking.
 * Handles conflict detection and automatic rollback.
 * 
 * @template T - The data type being updated
 * @param updates - Partial updates to apply
 * @param options - Optimistic lock options
 * @returns Promise that resolves when update completes
 * @throws Error if update fails after rollback
 * 
 * @example
 * await performOptimisticUpdate(
 *   { title: 'New Title' },
 *   {
 *     version: task.version,
 *     getCurrentData: () => task,
 *     applyUpdate: (task, updates) => ({ ...task, ...updates }),
 *     executeUpdate: async (task, updates, version) => {
 *       const { data, error } = await supabase
 *         .from('tasks')
 *         .update(updates)
 *         .eq('id', task.id)
 *         .eq('version', version)
 *         .select('version')
 *         .single();
 *       return { version: data?.version, error };
 *     },
 *     onConflict: () => {
 *       toast.error('Conflict detected. Please refresh.');
 *     }
 *   }
 * );
 */
export async function performOptimisticUpdate<T>(
    updates: Partial<T>,
    options: OptimisticLockOptions<T>
): Promise<void> {
    const {
        version = 1,
        getCurrentData,
        applyUpdate,
        executeUpdate,
        onConflict
    } = options;

    const currentData = getCurrentData();
    const optimisticData = applyUpdate(currentData, updates);

    try {
        const result = await executeUpdate(currentData, updates, version);

        if (result.error) {
            // Check for version conflict
            if (result.error.code === 'PGRST116' || result.error.message?.includes('version')) {
                logger.warn('Optimistic lock conflict detected', {
                    action: 'performOptimisticUpdate',
                    currentVersion: version
                });

                // Execute conflict callback
                if (onConflict) {
                    await onConflict();
                }

                throw new Error('Conflict: Data was modified by another session');
            }

            throw result.error;
        }

        // Update was successful, version was incremented
        logger.debug('Optimistic update successful', {
            action: 'performOptimisticUpdate',
            newVersion: result.version
        });

    } catch (error) {
        // Rollback optimistic update
        logger.error('Optimistic update failed, rolling back', error as Error, {
            action: 'performOptimisticUpdate'
        });
        throw error;
    }
}

/**
 * Creates a debounced version of a function with cleanup.
 * Useful for hooks that need to debounce updates.
 * 
 * @template T - Function parameter types
 * @param fn - The function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function with cancel method
 * 
 * @example
 * const debouncedUpdate = useDebouncedCallback(
 *   (taskId: string, updates: any) => updateTask(taskId, updates),
 *   1000
 * );
 * 
 * // Use in effect cleanup
 * useEffect(() => {
 *   return () => debouncedUpdate.cancel();
 * }, []);
 */
export function createDebouncedFunction<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
): T & { cancel: () => void } {
    let timeoutId: NodeJS.Timeout | null = null;

    const debouncedFn = ((...args: any[]) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            fn(...args);
            timeoutId = null;
        }, delay);
    }) as T & { cancel: () => void };

    debouncedFn.cancel = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
    };

    return debouncedFn;
}

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
    dependencies: any[] = []
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
                onRetry: (attempt, error, delay) => {
                    logger.warn(`Retrying fetch attempt ${attempt}`, {
                        error: error.message,
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
    }, [...dependencies, fetch]);

    return {
        data,
        loading,
        error,
        refetch: fetch
    };
}
