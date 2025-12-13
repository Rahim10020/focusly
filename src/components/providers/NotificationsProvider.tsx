"use client";
import React, { createContext, useContext } from 'react';
import { useNotifications as useNotificationsHook } from '@/lib/hooks/useNotifications';

type NotificationsContextType = ReturnType<typeof useNotificationsHook> | null;

const NotificationsContext = createContext<NotificationsContextType>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
    const notifications = useNotificationsHook();

    return (
        <NotificationsContext.Provider value={notifications}>
            {children}
        </NotificationsContext.Provider>
    );
}

export function useNotificationsContext() {
    const ctx = useContext(NotificationsContext);
    if (!ctx) {
        throw new Error('useNotificationsContext must be used within a NotificationsProvider. Make sure NotificationsProvider is included in the app layout.');
    }
    return ctx;
}
