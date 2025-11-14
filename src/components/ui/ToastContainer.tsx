'use client';

import Toast, { ToastProps } from './Toast';

interface ToastContainerProps {
    toasts: ToastProps[];
    onClose: (id: string) => void;
}

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
