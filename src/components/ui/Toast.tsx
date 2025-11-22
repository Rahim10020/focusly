/**
 * @fileoverview Toast notification component with auto-dismiss functionality.
 */

'use client';

import { useEffect } from 'react';

/**
 * Props for the Toast component.
 * @interface ToastProps
 * @exports
 */
export interface ToastProps {
    /** Unique identifier for the toast */
    id: string;
    /** Visual style and icon variant */
    type: 'success' | 'error' | 'warning' | 'info';
    /** Main message title */
    title: string;
    /** Optional additional description */
    description?: string;
    /** Auto-dismiss duration in milliseconds (0 to disable) */
    duration?: number;
    /** Callback when toast is closed */
    onClose: (id: string) => void;
}

const icons = {
    success: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    ),
    error: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    ),
    warning: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    ),
    info: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
};

const styles = {
    success: 'bg-[var(--success)] text-white',
    error: 'bg-[var(--error)] text-white',
    warning: 'bg-[var(--warning)] text-white',
    info: 'bg-[var(--info)] text-white',
};

/**
 * A toast notification component for displaying temporary messages.
 * Supports multiple types (success, error, warning, info) with appropriate icons.
 * Auto-dismisses after specified duration.
 *
 * @param {ToastProps} props - The component props
 * @param {string} props.id - Unique identifier
 * @param {('success'|'error'|'warning'|'info')} props.type - Toast type
 * @param {string} props.title - Main message
 * @param {string} [props.description] - Additional description
 * @param {number} [props.duration=5000] - Auto-dismiss time in ms
 * @param {Function} props.onClose - Close callback
 * @returns {JSX.Element} The rendered toast element
 *
 * @example
 * // Success toast
 * <Toast
 *   id="1"
 *   type="success"
 *   title="Task completed"
 *   onClose={handleClose}
 * />
 *
 * @example
 * // Error toast with description
 * <Toast
 *   id="2"
 *   type="error"
 *   title="Failed to save"
 *   description="Please check your connection"
 *   duration={10000}
 *   onClose={handleClose}
 * />
 */
export default function Toast({ id, type, title, description, duration = 5000, onClose }: ToastProps) {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose(id);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [id, duration, onClose]);

    return (
        <div
            className={`flex items-start gap-3 p-4 rounded-xl shadow-lg ${styles[type]} animate-slide-up min-w-[320px] max-w-md`}
            role="alert"
        >
            <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{title}</p>
                {description && <p className="text-sm opacity-90 mt-1">{description}</p>}
            </div>
            <button
                onClick={() => onClose(id)}
                className="flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
                aria-label="Close notification"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}
