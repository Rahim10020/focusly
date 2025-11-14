'use client';

import { useState, useCallback } from 'react';
import { ToastProps } from '@/components/ui/Toast';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
    type: ToastType;
    title: string;
    description?: string;
    duration?: number;
}

let toastIdCounter = 0;

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
