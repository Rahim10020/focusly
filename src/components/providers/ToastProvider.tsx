'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useToast } from '@/lib/hooks/useToast';
import ToastContainer from '@/components/ui/ToastContainer';

interface ToastContextType {
    success: (title: string, description?: string, duration?: number) => string;
    error: (title: string, description?: string, duration?: number) => string;
    warning: (title: string, description?: string, duration?: number) => string;
    info: (title: string, description?: string, duration?: number) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const { toasts, removeToast, success, error, warning, info } = useToast();

    return (
        <ToastContext.Provider value={{ success, error, warning, info }}>
            {children}
            <ToastContainer toasts={toasts} onClose={removeToast} />
        </ToastContext.Provider>
    );
}

export function useToastContext() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToastContext must be used within a ToastProvider');
    }
    return context;
}
