/**
 * @fileoverview Debounce utilities for React hooks.
 * Provides debounced function creation with proper cleanup.
 * @module lib/utils/debounce-helpers
 */

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
 * const debouncedUpdate = createDebouncedFunction(
 *   (taskId: string, updates: any) => updateTask(taskId, updates),
 *   1000
 * );
 *
 * // Use in effect cleanup
 * useEffect(() => {
 *   return () => debouncedUpdate.cancel();
 * }, []);
 */
export function createDebouncedFunction<T extends (...args: Parameters<T>) => ReturnType<T>>(
    fn: T,
    delay: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const debouncedFn = (...args: Parameters<T>) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            fn(...args);
            timeoutId = null;
        }, delay);
    };

    debouncedFn.cancel = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
    };

    return debouncedFn;
}

/**
 * Hook-style debounced callback with automatic cleanup.
 *
 * @template T - Function parameter types
 * @param fn - The function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 *
 * @example
 * const handleSearch = useDebouncedCallback(
 *   (query: string) => searchAPI(query),
 *   300
 * );
 */
export function useDebouncedCallback<T extends (...args: Parameters<T>) => ReturnType<T>>(
    fn: T,
    delay: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
    return createDebouncedFunction(fn, delay);
}
