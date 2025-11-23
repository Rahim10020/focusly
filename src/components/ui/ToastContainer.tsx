/**
 * @fileoverview Container component for managing multiple toast notifications.
 */

'use client';

import Toast, { ToastProps } from './Toast';

/**
 * Props for the ToastContainer component.
 * @interface ToastContainerProps
 */
interface ToastContainerProps {
    /** Array of toast notifications to display */
    toasts: ToastProps[];
    /** Callback when a toast is closed */
    onClose: (id: string) => void;
}

/**
 * A container component that manages and displays multiple toast notifications.
 * Positions toasts in the top-right corner of the viewport.
 *
 * @param {ToastContainerProps} props - The component props
 * @param {ToastProps[]} props.toasts - Array of toast data
 * @param {Function} props.onClose - Called when a toast is dismissed
 * @returns {JSX.Element|null} The rendered container or null if empty
 *
 * @example
 * const [toasts, setToasts] = useState([]);
 *
 * <ToastContainer
 *   toasts={toasts}
 *   onClose={(id) => setToasts(t => t.filter(toast => toast.id !== id))}
 * />
 */
export default function ToastContainer({ toasts, onClose }: ToastContainerProps) {
    if (toasts.length === 0) return null;

    return (
        <div
            className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"
            aria-live="polite"
            aria-atomic="true"
        >
            {toasts.map((toast) => (
                <div key={toast.id} className="pointer-events-auto">
                    <Toast {...toast} onClose={onClose} />
                </div>
            ))}
        </div>
    );
}
