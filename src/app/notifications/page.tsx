'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '@/components/layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useTasks } from '@/lib/hooks/useTasks';

interface Notification {
    id: string;
    type: 'task_completed' | 'task_overdue' | 'achievement' | 'info';
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
}

export default function NotificationsPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const { tasks, getOverdueTasks, getTasksDueToday } = useTasks();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (session && tasks) {
            try {
                generateNotifications();
                setError(null);
            } catch (err) {
                console.error('Error generating notifications:', err);
                setError('Failed to load notifications. Please refresh the page.');
            }
        }
    }, [tasks, session]);

    const generateNotifications = () => {
        const notifs: Notification[] = [];

        // Overdue tasks notifications
        const overdueTasks = getOverdueTasks();
        overdueTasks.forEach(task => {
            notifs.push({
                id: `overdue-${task.id}`,
                type: 'task_overdue',
                title: 'Task Overdue',
                message: `"${task.title}" is overdue`,
                timestamp: task.dueDate || Date.now(),
                read: false,
            });
        });

        // Tasks due today
        const tasksDueToday = getTasksDueToday();
        tasksDueToday.forEach(task => {
            notifs.push({
                id: `due-today-${task.id}`,
                type: 'info',
                title: 'Task Due Today',
                message: `"${task.title}" is due today`,
                timestamp: task.dueDate || Date.now(),
                read: false,
            });
        });

        // Recently completed tasks
        const recentlyCompleted = tasks
            .filter(t => t.completed && t.completedAt && Date.now() - t.completedAt < 24 * 60 * 60 * 1000)
            .slice(0, 5);

        recentlyCompleted.forEach(task => {
            notifs.push({
                id: `completed-${task.id}`,
                type: 'task_completed',
                title: 'Task Completed',
                message: `You completed "${task.title}"`,
                timestamp: task.completedAt || Date.now(),
                read: false,
            });
        });

        // Sort by timestamp (newest first)
        notifs.sort((a, b) => b.timestamp - a.timestamp);

        setNotifications(notifs);
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        router.push('/auth/signin');
        return null;
    }

    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !n.read)
        : notifications;

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const getNotificationIcon = (type: Notification['type']) => {
        switch (type) {
            case 'task_completed':
                return '✅';
            case 'task_overdue':
                return '⚠️';
            case 'achievement':
                return '🏆';
            case 'info':
                return '📌';
            default:
                return '🔔';
        }
    };

    const getNotificationColor = (type: Notification['type']) => {
        switch (type) {
            case 'task_completed':
                return 'border-green-500/20 bg-green-500/5';
            case 'task_overdue':
                return 'border-red-500/20 bg-red-500/5';
            case 'achievement':
                return 'border-yellow-500/20 bg-yellow-500/5';
            case 'info':
                return 'border-blue-500/20 bg-blue-500/5';
            default:
                return 'border-border';
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="max-w-4xl mx-auto px-6 py-8">
                {/* Page Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Notifications</h1>
                        <p className="text-muted-foreground">
                            Stay updated with your tasks and achievements
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <Button variant="outline" onClick={markAllAsRead}>
                            Mark all as read
                        </Button>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <div className="flex items-center gap-2">
                            <span className="text-red-500 text-lg">⚠️</span>
                            <p className="text-red-500 text-sm">{error}</p>
                            <button
                                onClick={() => setError(null)}
                                className="ml-auto text-red-500 hover:text-red-600"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6">
                    <Button
                        variant={filter === 'all' ? 'primary' : 'outline'}
                        onClick={() => setFilter('all')}
                    >
                        All ({notifications.length})
                    </Button>
                    <Button
                        variant={filter === 'unread' ? 'primary' : 'outline'}
                        onClick={() => setFilter('unread')}
                    >
                        Unread ({unreadCount})
                    </Button>
                </div>

                {/* Notifications List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Your Notifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {filteredNotifications.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <div className="text-6xl mb-4">🔔</div>
                                <p className="text-lg mb-2">No notifications</p>
                                <p className="text-sm">
                                    {filter === 'unread'
                                        ? 'All caught up! No unread notifications.'
                                        : 'You have no notifications yet'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredNotifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 rounded-lg border transition-all ${notification.read
                                            ? 'border-border bg-card opacity-60'
                                            : `${getNotificationColor(notification.type)} border-2`
                                            }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="text-2xl mt-1">
                                                {getNotificationIcon(notification.type)}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <h3 className="font-semibold mb-1">
                                                            {notification.title}
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground mb-2">
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(notification.timestamp).toLocaleString()}
                                                        </p>
                                                    </div>

                                                    {!notification.read && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => markAsRead(notification.id)}
                                                            className="text-xs"
                                                        >
                                                            Mark read
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
