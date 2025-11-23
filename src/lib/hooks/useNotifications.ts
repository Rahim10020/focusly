/**
 * @fileoverview Push notifications management hook.
 * Handles browser notification permissions and provides
 * a simple API for showing native push notifications.
 */

import { useEffect, useState } from 'react';

/**
 * Hook for managing browser push notifications.
 * Handles permission requests and provides notification display functionality.
 *
 * @returns {Object} Notification state and functions
 * @returns {NotificationPermission} returns.permission - Current permission status ('default' | 'granted' | 'denied')
 * @returns {Function} returns.requestPermission - Request notification permission from user
 * @returns {Function} returns.showNotification - Display a native notification
 * @returns {boolean} returns.isSupported - Whether notifications are supported in this browser
 *
 * @example
 * const { permission, requestPermission, showNotification, isSupported } = useNotifications();
 *
 * // Request permission if needed
 * if (permission === 'default') {
 *   const result = await requestPermission();
 *   if (result === 'granted') {
 *     showNotification('Welcome!', { body: 'Notifications enabled' });
 *   }
 * }
 *
 * // Show a notification
 * showNotification('Timer Complete', {
 *   body: 'Time for a break!',
 *   icon: '/icon.png'
 * });
 */
export function useNotifications() {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
            setIsSupported(true);
        }
    }, []);

    const requestPermission = async () => {
        if ('Notification' in window) {
            const result = await Notification.requestPermission();
            setPermission(result);
            return result;
        }
        return 'denied';
    };

    const showNotification = (title: string, options?: NotificationOptions) => {
        if ('Notification' in window && permission === 'granted') {
            new Notification(title, {
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                ...options,
            });
        }
    };

    return {
        permission,
        requestPermission,
        showNotification,
        isSupported,
    };
}