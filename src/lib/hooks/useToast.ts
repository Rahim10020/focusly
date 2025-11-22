/**
 * @fileoverview Toast notification management hook.
 * Provides a queue-based system for displaying temporary
 * notifications with different types (success, error, warning, info).
 */

'use client';

import { useState, useCallback } from 'react';
import { ToastProps } from '@/components/ui/Toast';

/**
 * Available toast notification types.
 * @typedef {'success' | 'error' | 'warning' | 'info'} ToastType
 */
type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Options for creating a toast notification.
 * @interface ToastOptions
 */
interface ToastOptions {
    /** Type of toast (success, error, warning, info) */
    type: ToastType;
    /** Main title of the toast */
    title: string;
    /** Optional description text */
    description?: string;
    /** Display duration in milliseconds (default: 5000) */
    duration?: number;
}

/** Counter for generating unique toast IDs */
let toastIdCounter = 0;

/**
 * Hook for managing toast notifications.
 * Provides methods to add different types of toasts with automatic removal.
 *
 * @returns {Object} Toast state and management functions
 * @returns {ToastProps[]} returns.toasts - Array of active toasts
 * @returns {Function} returns.addToast - Add a toast with full options
 * @returns {Function} returns.removeToast - Manually remove a toast
 * @returns {Function} returns.success - Show a success toast
 * @returns {Function} returns.error - Show an error toast
 * @returns {Function} returns.warning - Show a warning toast
 * @returns {Function} returns.info - Show an info toast
 *
 * @example
 * const { success, error, warning, toasts } = useToast();
 *
 * // Show success notification
 * success('Task completed', 'Great job!');
 *
 * // Show error notification with custom duration
 * error('Failed to save', 'Please try again', 10000);
 *
 * // Render toasts
 * {toasts.map(toast => (
 *   <Toast key={toast.id} {...toast} />
 * ))}
 */
export function useToast() {
    const [toasts, setToasts] = useState<ToastProps[]>([]);

    const addToast = useCallback((options: ToastOptions) => {
        const id = `toast-${++toastIdCounter}`;
        const newToast: ToastProps = {
            id,
            type: options.type,
            title: options.title,
            description: options.description,
            duration: options.duration || 5000,
            onClose: (toastId: string) => removeToast(toastId),
        };

        setToasts((prev) => [...prev, newToast]);
        return id;
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const success = useCallback(
        (title: string, description?: string, duration?: number) => {
            return addToast({ type: 'success', title, description, duration });
        },
        [addToast]
    );

    const error = useCallback(
        (title: string, description?: string, duration?: number) => {
            return addToast({ type: 'error', title, description, duration });
        },
        [addToast]
    );

    const warning = useCallback(
        (title: string, description?: string, duration?: number) => {
            return addToast({ type: 'warning', title, description, duration });
        },
        [addToast]
    );

    const info = useCallback(
        (title: string, description?: string, duration?: number) => {
            return addToast({ type: 'info', title, description, duration });
        },
        [addToast]
    );

    return {
        toasts,
        addToast,
        removeToast,
        success,
        error,
        warning,
        info,
    };
}
