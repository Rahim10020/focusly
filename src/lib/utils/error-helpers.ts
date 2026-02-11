/**
 * @fileoverview Error handling utilities for hooks and async operations.
 * Provides standardized error detection, transformation, and retry logic.
 * @module lib/utils/error-helpers
 */

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
 * Determines if an error is retryable based on common patterns
 *
 * @param error - The error to check
 * @returns true if the error should be retried
 *
 * @example
 * if (isRetryableError(error)) {
 *   // Retry the operation
 * }
 */
export function isRetryableError(error: unknown): boolean {
    if (!error) return false;

    const err = error as { code?: number | string; status?: number; statusCode?: number; message?: string };
    const code = err.code || err.status || err.statusCode;
    const message = err.message || String(error);

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
    if (code && typeof code === 'number' && code >= 500 && code < 600) {
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
 *
 * @param error - The error to format
 * @returns A user-friendly error message
 *
 * @example
 * toast.error(getUserMessage(error));
 */
export function getUserMessage(error: unknown): string {
    if (!error) return 'An unknown error occurred';

    const err = error as { code?: string; message?: string };
    const message = err.message || String(error);

    // Map common database errors to user-friendly messages
    if (message.includes('unique constraint') || err.code === '23505') {
        return 'This item already exists';
    }

    if (message.includes('foreign key constraint') || err.code === '23503') {
        return 'Cannot complete this action due to related data';
    }

    if (message.includes('not found') || err.code === 'PGRST116') {
        return 'Item not found';
    }

    if (message.includes('unauthorized') || err.code === '401') {
        return 'You are not authorized to perform this action';
    }

    if (message.includes('network') || message.includes('timeout')) {
        return 'Network error. Please check your connection and try again.';
    }

    // Return the original message if no mapping found, but limit length
    return message.length > 100 ? message.substring(0, 100) + '...' : message;
}

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
    executeUpdate: (data: T, updates: Partial<T>, version: number) => Promise<{ version?: number; error?: unknown }>;
}
