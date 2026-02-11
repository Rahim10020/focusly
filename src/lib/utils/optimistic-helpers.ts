/**
 * @fileoverview Optimistic update utilities for React hooks.
 * Provides optimistic locking patterns with version-based conflict detection.
 * @module lib/utils/optimistic-helpers
 */

import { logger } from '../logger';
import { OptimisticLockOptions } from './error-helpers';

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
    applyUpdate(currentData, updates);

    try {
        const result = await executeUpdate(currentData, updates, version);

        if (result.error) {
            // Check for version conflict
            const err = result.error as { code?: string; message?: string };
            if (err.code === 'PGRST116' || err.message?.includes('version')) {
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
 * Creates an optimistic update handler for common CRUD operations.
 *
 * @template T - The data type
 * @param options - Configuration for the optimistic update
 * @returns Object with optimistic update methods
 */
export function createOptimisticUpdater<T>(
    options: {
        getData: () => T;
        setData: (data: T) => void;
        updateFn: (data: T, updates: Partial<T>) => T;
    }
) {
    const { getData, setData, updateFn } = options;

    return {
        /**
         * Apply optimistic update immediately
         */
        optimisticUpdate: (updates: Partial<T>): T => {
            const newData = updateFn(getData(), updates);
            setData(newData);
            return newData;
        },

        /**
         * Rollback to previous state
         */
        rollback: (previousData: T): void => {
            setData(previousData);
        },

        /**
         * Perform full optimistic update with rollback on error
         */
        update: async (
            updates: Partial<T>,
            serverUpdate: () => Promise<void>
        ): Promise<void> => {
            const previousData = getData();
            const newData = updateFn(previousData, updates);
            setData(newData);

            try {
                await serverUpdate();
            } catch (error) {
                setData(previousData);
                throw error;
            }
        }
    };
}
