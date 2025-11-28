/**
 * @fileoverview Retry utility with exponential backoff.
 * Provides resilient error handling for database operations and API calls.
 * 
 * @module lib/utils/retry
 */

import { logger } from '../logger';

/**
 * Error types that should not be retried
 */
const NON_RETRYABLE_ERROR_CODES = [
    '400', // Bad Request
    '401', // Unauthorized
    '403', // Forbidden
    '404', // Not Found
    '422', // Unprocessable Entity
    'PGRST116', // No rows found (Supabase)
];

/**
 * Options for retry configuration
 */
export interface RetryOptions {
    /** Maximum number of retry attempts (default: 3) */
    maxRetries?: number;
    /** Base delay in milliseconds (default: 1000) */
    baseDelay?: number;
    /** Maximum delay in milliseconds (default: 10000) */
    maxDelay?: number;
    /** Whether to use exponential backoff (default: true) */
    exponentialBackoff?: boolean;
    /** Custom function to determine if error should be retried */
    shouldRetry?: (error: Error) => boolean;
    /** Callback called on each retry attempt */
    onRetry?: (attempt: number, error: Error, delay: number) => void;
}

/**
 * Checks if an error should not be retried
 * 
 * @param error - The error to check
 * @returns true if the error should not be retried
 */
function isNonRetryableError(error: any): boolean {
    if (!error) return false;
    
    // Check error code
    const code = error.code || error.status || error.statusCode;
    if (code && NON_RETRYABLE_ERROR_CODES.some(c => String(code).startsWith(c))) {
        return true;
    }
    
    // Check error message for specific patterns
    const message = error.message || String(error);
    if (
        message.includes('validation') ||
        message.includes('invalid') ||
        message.includes('not found') ||
        message.includes('unauthorized')
    ) {
        return true;
    }
    
    return false;
}

/**
 * Executes a function with retry logic and exponential backoff.
 * Automatically retries on transient errors while respecting non-retryable errors.
 * 
 * @template T - The return type of the function
 * @param fn - The async function to execute with retry logic
 * @param options - Retry configuration options
 * @returns Promise resolving to the function's return value
 * @throws The last error encountered if all retries fail
 * 
 * @example
 * // Basic usage
 * const data = await retryWithBackoff(async () => {
 *   const { data, error } = await supabase.from('tasks').select('*');
 *   if (error) throw error;
 *   return data;
 * });
 * 
 * @example
 * // With custom options
 * const data = await retryWithBackoff(
 *   async () => {
 *     const response = await fetch('/api/data');
 *     if (!response.ok) throw new Error('Fetch failed');
 *     return response.json();
 *   },
 *   {
 *     maxRetries: 5,
 *     baseDelay: 2000,
 *     onRetry: (attempt, error, delay) => {
 *       console.log(`Retry ${attempt} after ${delay}ms: ${error.message}`);
 *     }
 *   }
 * );
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const {
        maxRetries = 3,
        baseDelay = 1000,
        maxDelay = 10000,
        exponentialBackoff = true,
        shouldRetry: customShouldRetry,
        onRetry
    } = options;

    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt <= maxRetries) {
        try {
            // Execute the function
            return await fn();
        } catch (error) {
            lastError = error as Error;
            attempt++;

            // Check if we should retry
            const isLastAttempt = attempt > maxRetries;
            const shouldNotRetry = isNonRetryableError(error);
            const customDecision = customShouldRetry ? !customShouldRetry(lastError) : false;

            if (isLastAttempt || shouldNotRetry || customDecision) {
                // Log final failure
                logger.error('Operation failed after retries', lastError, {
                    action: 'retryWithBackoff',
                    attempts: attempt,
                    maxRetries,
                    errorType: shouldNotRetry ? 'non-retryable' : 'max-attempts-reached'
                });
                throw lastError;
            }

            // Calculate delay with exponential backoff
            let delay = exponentialBackoff 
                ? Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay)
                : baseDelay;

            // Add jitter to prevent thundering herd
            delay = delay + Math.random() * 1000;

            // Log retry attempt
            logger.warn(`Retry attempt ${attempt}/${maxRetries}`, {
                action: 'retryWithBackoff',
                attempt,
                maxRetries,
                delay,
                error: lastError.message
            });

            // Call retry callback if provided
            if (onRetry) {
                onRetry(attempt, lastError, delay);
            }

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError || new Error('Retry failed with unknown error');
}

/**
 * Wraps a function to automatically retry on failure.
 * Creates a reusable function with built-in retry logic.
 * 
 * @template T - Function parameters type
 * @template R - Function return type
 * @param fn - The function to wrap
 * @param options - Retry configuration options
 * @returns A wrapped function with retry logic
 * 
 * @example
 * const fetchUserData = withRetry(
 *   async (userId: string) => {
 *     const { data, error } = await supabase
 *       .from('users')
 *       .select('*')
 *       .eq('id', userId)
 *       .single();
 *     if (error) throw error;
 *     return data;
 *   },
 *   { maxRetries: 3 }
 * );
 * 
 * // Use it multiple times
 * const user1 = await fetchUserData('user-1');
 * const user2 = await fetchUserData('user-2');
 */
export function withRetry<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    options: RetryOptions = {}
): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
        return retryWithBackoff(() => fn(...args), options);
    };
}

/**
 * Retries a batch of operations with individual retry logic.
 * Each operation is retried independently.
 * 
 * @template T - The return type of operations
 * @param operations - Array of async functions to execute
 * @param options - Retry configuration options
 * @returns Promise resolving to array of results (successful or null for failed)
 * 
 * @example
 * const results = await retryBatch(
 *   [
 *     () => supabase.from('tasks').insert(task1),
 *     () => supabase.from('tasks').insert(task2),
 *     () => supabase.from('tasks').insert(task3),
 *   ],
 *   { maxRetries: 2 }
 * );
 */
export async function retryBatch<T>(
    operations: Array<() => Promise<T>>,
    options: RetryOptions = {}
): Promise<Array<T | null>> {
    const results = await Promise.allSettled(
        operations.map(op => retryWithBackoff(op, options))
    );

    return results.map((result, index) => {
        if (result.status === 'fulfilled') {
            return result.value;
        } else {
            logger.error(`Batch operation ${index} failed`, result.reason, {
                action: 'retryBatch',
                operationIndex: index
            });
            return null;
        }
    });
}
