/**
 * @fileoverview Debounce utility function for delaying function execution.
 * Useful for optimizing frequent operations like search or auto-save.
 */

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 *
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @param options - Options object
 * @returns Debounced function with cancel method
 *
 * @example
 * const debouncedSave = debounce(saveToServer, 1000);
 * debouncedSave(data); // Will execute after 1 second of inactivity
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    options: { leading?: boolean; trailing?: boolean } = {}
): T & { cancel: () => void } {
    const { leading = false, trailing = true } = options;
    let timeout: NodeJS.Timeout | null = null;
    let lastCallTime: number | null = null;
    let lastInvokeTime = 0;

    function debounced(this: any, ...args: Parameters<T>): void {
        const time = Date.now();
        const isInvoking = shouldInvoke(time);

        lastCallTime = time;

        if (isInvoking) {
            if (timeout === null) {
                return leadingEdge(time, args);
            }
        }
        if (timeout === null && trailing) {
            timeout = setTimeout(() => trailingEdge(time, args), wait);
        }
    }

    function shouldInvoke(time: number): boolean {
        const timeSinceLastCall = time - (lastCallTime || 0);
        const timeSinceLastInvoke = time - lastInvokeTime;

        return (
            lastCallTime === null ||
            timeSinceLastCall >= wait ||
            timeSinceLastCall < 0 ||
            timeSinceLastInvoke >= wait
        );
    }

    function leadingEdge(time: number, args: Parameters<T>): void {
        lastInvokeTime = time;
        if (leading) {
            invokeFunc(args);
        }
        timeout = setTimeout(() => trailingEdge(time, args), wait);
    }

    function trailingEdge(time: number, args: Parameters<T>): void {
        timeout = null;
        if (trailing && lastCallTime !== null) {
            invokeFunc(args);
        }
        lastCallTime = null;
    }

    function invokeFunc(this: any, args: Parameters<T>): void {
        func.apply(this, args);
    }

    function cancel(): void {
        if (timeout !== null) {
            clearTimeout(timeout);
            timeout = null;
        }
        lastCallTime = null;
        lastInvokeTime = 0;
    }

    debounced.cancel = cancel;

    return debounced as T & { cancel: () => void };
}
