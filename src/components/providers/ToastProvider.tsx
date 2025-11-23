/**
 * @fileoverview Toast notification provider for displaying user feedback messages.
 * Provides context for showing success, error, warning, and info notifications.
 */

'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useToast } from '@/lib/hooks/useToast';
import ToastContainer from '@/components/ui/ToastContainer';

/**
 * Toast context type with methods for displaying different notification types.
 * @interface ToastContextType
 * @property {Function} success - Display a success toast notification
 * @property {Function} error - Display an error toast notification
 * @property {Function} warning - Display a warning toast notification
 * @property {Function} info - Display an info toast notification
 */
interface ToastContextType {
    success: (title: string, description?: string, duration?: number) => string;
    error: (title: string, description?: string, duration?: number) => string;
    warning: (title: string, description?: string, duration?: number) => string;
    info: (title: string, description?: string, duration?: number) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Toast provider component that manages toast notifications throughout the application.
 * Renders a ToastContainer to display active notifications.
 *
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components to wrap with toast context
 * @returns {JSX.Element} The wrapped children with toast context and container
 *
 * @example
 * // Wrap your app with ToastProvider
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 */
export function ToastProvider({ children }: { children: ReactNode }) {
    const { toasts, removeToast, success, error, warning, info } = useToast();

    return (
        <ToastContext.Provider value={{ success, error, warning, info }}>
            {children}
            <ToastContainer toasts={toasts} onClose={removeToast} />
        </ToastContext.Provider>
    );
}

/**
 * Custom hook to access toast notification methods.
 * Must be used within a ToastProvider component.
 *
 * @returns {ToastContextType} Object containing toast notification methods
 * @throws {Error} When used outside of ToastProvider
 *
 * @example
 * function MyComponent() {
 *   const toast = useToastContext();
 *
 *   const handleSave = async () => {
 *     try {
 *       await saveData();
 *       toast.success('Saved!', 'Your changes have been saved.');
 *     } catch (err) {
 *       toast.error('Error', 'Failed to save changes.');
 *     }
 *   };
 *
 *   return <button onClick={handleSave}>Save</button>;
 * }
 */
export function useToastContext() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToastContext must be used within a ToastProvider');
    }
    return context;
}
