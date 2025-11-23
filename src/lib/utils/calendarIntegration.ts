/**
 * @fileoverview Calendar integration utilities for exporting tasks to iCalendar format.
 * Provides functions to export tasks as .ics files for import into calendar applications.
 * @module lib/utils/calendarIntegration
 */

import { createEvents, DateArray, EventAttributes } from 'ics';
import { Task } from '@/types';
import { format } from 'date-fns';

/**
 * Exports multiple tasks to an ICS file and triggers download.
 * Creates calendar events with proper start/end times, descriptions, and alarms.
 * High priority tasks automatically get a 1-hour reminder alarm.
 *
 * @param {Task[]} tasks - Array of tasks to export
 * @returns {void}
 *
 * @example
 * exportTasksToICS(tasks); // Downloads focusly-tasks-2024-01-15.ics
 */
export const exportTasksToICS = (tasks: Task[]) => {
    const events: EventAttributes[] = tasks
        .filter(task => task.startDate || task.dueDate)
        .map(task => {
            const startDate = task.startDate || task.dueDate!;
            const date = new Date(startDate);

            // Parse start time if available
            let startHour = 9;
            let startMinute = 0;
            if (task.startTime) {
                const [h, m] = task.startTime.split(':').map(Number);
                startHour = h;
                startMinute = m;
            }

            // Calculate end time
            let endHour = startHour + 1;
            let endMinute = startMinute;
            if (task.endTime) {
                const [h, m] = task.endTime.split(':').map(Number);
                endHour = h;
                endMinute = m;
            } else if (task.estimatedDuration) {
                const totalMinutes = startHour * 60 + startMinute + task.estimatedDuration;
                endHour = Math.floor(totalMinutes / 60);
                endMinute = totalMinutes % 60;
            }

            const start: DateArray = [
                date.getFullYear(),
                date.getMonth() + 1,
                date.getDate(),
                startHour,
                startMinute,
            ];

            const end: DateArray = [
                date.getFullYear(),
                date.getMonth() + 1,
                date.getDate(),
                endHour,
                endMinute,
            ];

            const event: EventAttributes = {
                start,
                end,
                title: task.title,
                description: task.notes || `Priority: ${task.priority || 'None'}\nPomodoros: ${task.pomodoroCount}`,
                location: 'Focusly',
                status: task.completed ? 'CONFIRMED' : 'TENTATIVE',
                busyStatus: 'BUSY',
                categories: task.priority ? [task.priority] : undefined,
            };

            // Add alarm for high priority tasks
            if (task.priority === 'high') {
                event.alarms = [{
                    action: 'display',
                    trigger: { hours: 1, before: true },
                    description: `Task starting soon: ${task.title}`,
                }];
            }

            return event;
        });

    const { error, value } = createEvents(events);

    if (error) {
        console.error('Error creating ICS file:', error);
        return;
    }

    // Download the ICS file
    const blob = new Blob([value!], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `focusly-tasks-${format(new Date(), 'yyyy-MM-dd')}.ics`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Generates ICS content string for a single task.
 * Useful for sharing individual tasks or programmatic calendar integration.
 *
 * @param {Task} task - The task to generate ICS for
 * @returns {string | null} ICS content string, or null if task has no date
 *
 * @example
 * const icsContent = generateICSForTask(task);
 * if (icsContent) {
 *   // Use icsContent for sharing or integration
 * }
 */
export const generateICSForTask = (task: Task): string | null => {
    if (!task.startDate && !task.dueDate) {
        return null;
    }

    const startDate = task.startDate || task.dueDate!;
    const date = new Date(startDate);

    let startHour = 9;
    let startMinute = 0;
    if (task.startTime) {
        const [h, m] = task.startTime.split(':').map(Number);
        startHour = h;
        startMinute = m;
    }

    let endHour = startHour + 1;
    let endMinute = startMinute;
    if (task.endTime) {
        const [h, m] = task.endTime.split(':').map(Number);
        endHour = h;
        endMinute = m;
    } else if (task.estimatedDuration) {
        const totalMinutes = startHour * 60 + startMinute + task.estimatedDuration;
        endHour = Math.floor(totalMinutes / 60);
        endMinute = totalMinutes % 60;
    }

    const start: DateArray = [
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
        startHour,
        startMinute,
    ];

    const end: DateArray = [
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
        endHour,
        endMinute,
    ];

    const { error, value } = createEvents([{
        start,
        end,
        title: task.title,
        description: task.notes || `Priority: ${task.priority || 'None'}\nPomodoros: ${task.pomodoroCount}`,
        location: 'Focusly',
        status: task.completed ? 'CONFIRMED' : 'TENTATIVE',
        busyStatus: 'BUSY',
    }]);

    if (error) {
        console.error('Error creating ICS for task:', error);
        return null;
    }

    return value!;
};

/**
 * Generates calendar subscription data for incomplete tasks.
 * Returns ICS content that could be used for calendar subscriptions.
 * Note: Full subscription support requires backend endpoint implementation.
 *
 * @param {Task[]} tasks - Array of tasks to include in subscription
 * @returns {string | null} ICS content string, or null on error
 *
 * @example
 * const subscriptionData = generateCalendarSubscriptionData(tasks);
 * // Could be served from a backend endpoint as webcal://
 */
export const generateCalendarSubscriptionData = (tasks: Task[]) => {
    // This would typically generate a webcal:// URL that points to a backend endpoint
    // For now, we'll just generate the ICS content
    const events: EventAttributes[] = tasks
        .filter(task => (task.startDate || task.dueDate) && !task.completed)
        .map(task => {
            const startDate = task.startDate || task.dueDate!;
            const date = new Date(startDate);

            const startHour = task.startTime ? parseInt(task.startTime.split(':')[0]) : 9;
            const startMinute = task.startTime ? parseInt(task.startTime.split(':')[1]) : 0;

            let endHour = startHour + 1;
            let endMinute = startMinute;
            if (task.endTime) {
                endHour = parseInt(task.endTime.split(':')[0]);
                endMinute = parseInt(task.endTime.split(':')[1]);
            }

            return {
                start: [date.getFullYear(), date.getMonth() + 1, date.getDate(), startHour, startMinute] as DateArray,
                end: [date.getFullYear(), date.getMonth() + 1, date.getDate(), endHour, endMinute] as DateArray,
                title: task.title,
                description: task.notes || '',
                status: 'TENTATIVE' as const,
            };
        });

    const { error, value } = createEvents(events);

    if (error) {
        console.error('Error creating subscription calendar:', error);
        return null;
    }

    return value;
};
