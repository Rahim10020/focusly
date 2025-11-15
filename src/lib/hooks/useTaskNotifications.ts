import { useEffect } from 'react';
import { Task } from '@/types';

interface UseTaskNotificationsProps {
    tasks: Task[];
    enabled: boolean;
}

export function useTaskNotifications({ tasks, enabled }: UseTaskNotificationsProps) {
    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return;

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        // Check for tasks starting soon
        const checkUpcomingTasks = () => {
            const now = Date.now();
            const oneHourFromNow = now + (60 * 60 * 1000);

            tasks.forEach(task => {
                if (task.completed || !task.startDate) return;

                const taskStartTime = task.startDate;

                // If task has a start time, combine it with the date
                if (task.startTime) {
                    const [hours, minutes] = task.startTime.split(':').map(Number);
                    const taskDate = new Date(task.startDate);
                    taskDate.setHours(hours, minutes, 0, 0);

                    const timeUntilStart = taskDate.getTime() - now;

                    // Notify 1 hour before
                    if (timeUntilStart > 0 && timeUntilStart <= 60 * 60 * 1000) {
                        showNotification(
                            `Task starting soon: ${task.title}`,
                            `Starts in ${Math.round(timeUntilStart / 60000)} minutes`,
                            task.id
                        );
                    }
                    // Notify when task starts
                    else if (timeUntilStart >= -60000 && timeUntilStart <= 0) {
                        showNotification(
                            `Task starting now: ${task.title}`,
                            task.notes || 'Time to focus!',
                            task.id
                        );
                    }
                }
                // If no start time but has start date, check if it's today
                else if (taskStartTime <= oneHourFromNow && taskStartTime >= now) {
                    showNotification(
                        `Task scheduled for today: ${task.title}`,
                        task.notes || 'Don\'t forget this task!',
                        task.id
                    );
                }
            });

            // Check for overdue tasks
            tasks.forEach(task => {
                if (task.completed || !task.dueDate) return;

                if (task.dueDate < now) {
                    const daysOverdue = Math.floor((now - task.dueDate) / (24 * 60 * 60 * 1000));
                    if (daysOverdue === 0) {
                        showNotification(
                            `Overdue task: ${task.title}`,
                            'This task is overdue today!',
                            task.id
                        );
                    }
                }
            });
        };

        const showNotification = (title: string, body: string, taskId: string) => {
            if ('Notification' in window && Notification.permission === 'granted') {
                // Check if we already showed this notification recently (within last hour)
                const notifKey = `notif_${taskId}_${title}`;
                const lastShown = localStorage.getItem(notifKey);
                if (lastShown && Date.now() - parseInt(lastShown) < 60 * 60 * 1000) {
                    return; // Don't spam notifications
                }

                const notification = new Notification(title, {
                    body,
                    icon: '/icon-192.png',
                    badge: '/icon-192.png',
                    tag: taskId,
                    requireInteraction: false,
                });

                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };

                // Store that we showed this notification
                localStorage.setItem(notifKey, Date.now().toString());
            }
        };

        // Check immediately
        checkUpcomingTasks();

        // Check every 5 minutes
        const interval = setInterval(checkUpcomingTasks, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [tasks, enabled]);

    const requestPermission = async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return false;
    };

    return { requestPermission };
}
