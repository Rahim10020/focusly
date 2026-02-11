/**
 * @fileoverview Utility helpers for custom hooks.
 * Provides standard patterns for error handling, optimistic locking,
 * and state management across hooks.
 *
 * This module re-exports functions from specialized modules for backward compatibility.
 * Import directly from specific modules for better tree-shaking.
 *
 * @module lib/utils/hookHelpers
 */

// Re-export error handling utilities
export {
    isRetryableError,
    getUserMessage,
    type HookResult,
    type ErrorHandlingOptions,
    type OptimisticLockOptions
} from './error-helpers';

// Re-export optimistic update utilities
export {
    performOptimisticUpdate,
    createOptimisticUpdater
} from './optimistic-helpers';

// Re-export debounce utilities
export {
    createDebouncedFunction,
    useDebouncedCallback
} from './debounce-helpers';

// Re-export fetch utilities
export {
    useDataFetching,
    useFetchWithInitial,
    usePolling
} from './fetch-helpers';
