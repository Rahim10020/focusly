/**
 * @fileoverview Custom hook for managing user notifications.
 * Provides functionality to fetch, mark as read, and delete notifications.
 * @module lib/hooks/useNotifications
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Represents a notification object.
 */
export interface Notification {
    /** Unique notification identifier */
    id: string;
    /** ID of the user who owns the notification */
    user_id: string;
    /** Type of notification */
    type: 'friend_request' | 'friend_request_accepted' | 'task_completed' | 'task_overdue' | 'achievement' | 'info';
    /** Notification title */
    title: string;
    /** Detailed notification message */
    message: string;
    /** Additional notification data */
    data: any | null;
    /** Whether the notification has been read */
    read: boolean;
    /** Timestamp when the notification was created */
    created_at: string;
    /** Timestamp when the notification was last updated */
    updated_at: string;
}

/**
 * Hook for managing user notifications.
 * Provides methods to fetch, mark as read, and delete notifications.
 *
 * @returns {Object} Notification management functions and state
 * @property {Notification[]} notifications - Array of user notifications
 * @property {boolean} loading - Whether notifications are being fetched
 * @property {string|null} error - Error message if any operation failed
 * @property {number} unreadCount - Number of unread notifications
 * @property {Function} fetchNotifications - Function to fetch notifications
 * @property {Function} markAsRead - Function to mark a notification as read
 * @property {Function} markAllAsRead - Function to mark all notifications as read
 * @property {Function} deleteNotification - Function to delete a notification
 * @property {Function} createNotification - Function to create a new notification
 */
export function useNotifications() {
    const { data: session } = useSession();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetches all notifications for the current user.
     */
    const fetchNotifications = useCallback(async () => {
        if (!session?.user) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/notifications');
            if (!response.ok) {
                throw new Error('Failed to fetch notifications');
            }
            const data = await response.json();
            setNotifications(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error fetching notifications:', err);
        } finally {
            setLoading(false);
        }
    }, [session?.user]);

    /**
     * Marks a specific notification as read or unread.
     * @param {string} notificationId - ID of the notification to update
     * @param {boolean} read - Whether to mark as read (true) or unread (false)
     */
    const markAsRead = useCallback(async (notificationId: string, read: boolean = true) => {
        try {
            const response = await fetch(`/api/notifications/${notificationId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ read }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update notification');
            }

            // Update local state
            setNotifications(prev =>
                prev.map(notification =>
                    notification.id === notificationId
                        ? { ...notification, read }
                        : notification
                )
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update notification');
            console.error('Error updating notification:', err);
        }
    }, []);

    /**
     * Marks all notifications as read.
     */
    const markAllAsRead = useCallback(async () => {
        try {
            // Update all notifications in local state
            const unreadNotifications = notifications.filter(n => !n.read);
            await Promise.all(
                unreadNotifications.map(notification => markAsRead(notification.id, true))
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to mark all notifications as read');
            console.error('Error marking all notifications as read:', err);
        }
    }, [notifications, markAsRead]);

    /**
     * Deletes a specific notification.
     * @param {string} notificationId - ID of the notification to delete
     */
    const deleteNotification = useCallback(async (notificationId: string) => {
        try {
            const response = await fetch(`/api/notifications/${notificationId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete notification');
            }

            // Update local state
            setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete notification');
            console.error('Error deleting notification:', err);
        }
    }, []);

    /**
     * Creates a new notification.
     * @param {Omit<Notification, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'read'>} notificationData - Data for the new notification
     */
    const createNotification = useCallback(async (notificationData: {
        user_id: string;
        type: Notification['type'];
        title: string;
        message: string;
        data?: any;
    }) => {
        try {
            const response = await fetch('/api/notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(notificationData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create notification');
            }

            const newNotification = await response.json();

            // If the notification is for the current user, add it to local state
            if (newNotification.user_id === session?.user?.id) {
                setNotifications(prev => [newNotification, ...prev]);
            }

            return newNotification;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create notification');
            console.error('Error creating notification:', err);
            throw err;
        }
    }, [session?.user?.id]);

    // Fetch notifications when session changes
    useEffect(() => {
        if (session?.user) {
            fetchNotifications();
        } else {
            setNotifications([]);
        }
    }, [session?.user, fetchNotifications]);

    // Calculate unread count
    const unreadCount = notifications.filter(notification => !notification.read).length;

    return {
        notifications,
        loading,
        error,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        createNotification,
    };
}