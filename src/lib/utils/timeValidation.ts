/**
 * @fileoverview Time validation utilities for task scheduling.
 * Provides functions to validate time ranges, date ranges, check for overlaps,
 * and suggest optimal time slots for task scheduling.
 * @module lib/utils/timeValidation
 */

import { Task } from '@/types';

/**
 * Result of a time validation operation.
 * @interface TimeValidationResult
 */
export interface TimeValidationResult {
    /** Whether the validation passed without errors */
    valid: boolean;
    /** Array of error messages (validation failures) */
    errors: string[];
    /** Array of warning messages (non-critical issues) */
    warnings: string[];
}

/**
 * Result of checking for time slot overlaps.
 * @interface TimeOverlapResult
 */
export interface TimeOverlapResult {
    /** Whether any overlap was detected */
    hasOverlap: boolean;
    /** Array of tasks that have overlapping time slots */
    overlappingTasks: Task[];
}

/**
 * Validates that a time range is valid (start time must be before end time).
 * Also provides warnings for very short or very long durations.
 *
 * @param {string} startTime - Start time in HH:mm format
 * @param {string} endTime - End time in HH:mm format
 * @returns {TimeValidationResult} Validation result with errors and warnings
 *
 * @example
 * validateTimeRange('09:00', '17:00'); // { valid: true, errors: [], warnings: [] }
 * validateTimeRange('17:00', '09:00'); // { valid: false, errors: ['Start time must be before end time'], warnings: [] }
 */
export function validateTimeRange(startTime: string, endTime: string): TimeValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!startTime || !endTime) {
        return { valid: true, errors, warnings };
    }

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes >= endMinutes) {
        errors.push('Start time must be before end time');
    }

    const duration = endMinutes - startMinutes;
    if (duration < 5) {
        warnings.push('Task duration is very short (less than 5 minutes)');
    }

    if (duration > 480) {
        // More than 8 hours
        warnings.push('Task duration is very long (more than 8 hours)');
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Validates that a date range is valid (start date must be before or equal to due date).
 * If dates are the same, also validates that start time is before end time.
 * Also provides warnings for tasks spanning more than a year.
 *
 * @param {number} [startDate] - Start date as Unix timestamp in milliseconds
 * @param {number} [dueDate] - Due date as Unix timestamp in milliseconds
 * @param {string} [startTime] - Start time in HH:mm format
 * @param {string} [endTime] - End time in HH:mm format
 * @returns {TimeValidationResult} Validation result with errors and warnings
 *
 * @example
 * validateDateRange(Date.now(), Date.now() + 86400000); // Valid: start before due
 * validateDateRange(Date.now(), Date.now(), '09:00', '10:00'); // Valid: same day, start before end
 * validateDateRange(Date.now(), Date.now(), '10:00', '09:00'); // Invalid: same day, start after end
 */
export function validateDateRange(startDate?: number, dueDate?: number, startTime?: string, endTime?: string): TimeValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!startDate || !dueDate) {
        return { valid: true, errors, warnings };
    }

    const start = new Date(startDate);
    const due = new Date(dueDate);

    // Reset to midnight for date comparison
    start.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    if (start > due) {
        errors.push('Start date must be before or equal to due date');
    } else if (start.getTime() === due.getTime() && startTime && endTime) {
        // Same day, validate times
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        if (startMinutes >= endMinutes) {
            errors.push('Start time must be before end time');
        }
    }

    const daysDiff = Math.ceil((due.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 365) {
        warnings.push('Task spans more than a year');
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Checks for time slot overlaps with existing tasks on the same day.
 * Excludes the current task (for editing) and completed tasks from the check.
 *
 * @param {Task[]} tasks - Array of all tasks to check against
 * @param {string | undefined} currentTaskId - ID of the task being edited (to exclude from check)
 * @param {number | undefined} startDate - Start date as Unix timestamp
 * @param {string | undefined} startTime - Start time in HH:mm format
 * @param {string | undefined} endTime - End time in HH:mm format
 * @returns {TimeOverlapResult} Result containing overlap status and conflicting tasks
 *
 * @example
 * const result = checkTimeOverlaps(tasks, 'task-123', Date.now(), '09:00', '10:00');
 * if (result.hasOverlap) {
 *   console.log('Conflicts with:', result.overlappingTasks);
 * }
 */
export function checkTimeOverlaps(
    tasks: Task[],
    currentTaskId: string | undefined,
    startDate: number | undefined,
    startTime: string | undefined,
    endTime: string | undefined
): TimeOverlapResult {
    if (!startDate || !startTime || !endTime) {
        return { hasOverlap: false, overlappingTasks: [] };
    }

    const [currentStartHour, currentStartMin] = startTime.split(':').map(Number);
    const [currentEndHour, currentEndMin] = endTime.split(':').map(Number);

    const currentStart = new Date(startDate);
    currentStart.setHours(currentStartHour, currentStartMin, 0, 0);

    const currentEnd = new Date(startDate);
    currentEnd.setHours(currentEndHour, currentEndMin, 0, 0);

    const overlappingTasks = tasks.filter(task => {
        // Skip current task and completed tasks
        if (task.id === currentTaskId || task.completed) {
            return false;
        }

        // Check if task has time slot
        if (!task.startDate || !task.startTime || !task.endTime) {
            return false;
        }

        const taskDate = new Date(task.startDate);
        taskDate.setHours(0, 0, 0, 0);

        const checkDate = new Date(startDate);
        checkDate.setHours(0, 0, 0, 0);

        // Only check tasks on the same day
        if (taskDate.getTime() !== checkDate.getTime()) {
            return false;
        }

        const [taskStartHour, taskStartMin] = task.startTime.split(':').map(Number);
        const [taskEndHour, taskEndMin] = task.endTime.split(':').map(Number);

        const taskStart = new Date(task.startDate);
        taskStart.setHours(taskStartHour, taskStartMin, 0, 0);

        const taskEnd = new Date(task.startDate);
        taskEnd.setHours(taskEndHour, taskEndMin, 0, 0);

        // Check for overlap
        // Overlap occurs if: (currentStart < taskEnd) AND (currentEnd > taskStart)
        return currentStart < taskEnd && currentEnd > taskStart;
    });

    return {
        hasOverlap: overlappingTasks.length > 0,
        overlappingTasks
    };
}

/**
 * Calculates the duration in minutes between start and end times.
 * Handles cases where the end time crosses midnight (e.g., 23:00 to 01:00).
 *
 * @param {string} startTime - Start time in HH:mm format
 * @param {string} endTime - End time in HH:mm format
 * @returns {number} Duration in minutes (minimum 0)
 *
 * @example
 * calculateDuration('09:00', '10:30'); // Returns 90
 * calculateDuration('23:00', '01:00'); // Returns 120 (2 hours, crossing midnight)
 */
export function calculateDuration(startTime: string, endTime: string): number {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    // Create date objects for comparison
    const start = new Date();
    start.setHours(startHour, startMin, 0, 0);

    const end = new Date();
    end.setHours(endHour, endMin, 0, 0);

    // Handle case where end time is on the next day
    if (end <= start) {
        end.setDate(end.getDate() + 1);
    }

    const diffInMs = end.getTime() - start.getTime();
    const diffInMinutes = Math.round(diffInMs / (1000 * 60));

    return Math.max(0, diffInMinutes);
}

/**
 * Calculates the end time based on a start time and duration.
 * Wraps around midnight if the duration extends past 24:00.
 *
 * @param {string} startTime - Start time in HH:mm format
 * @param {number} durationMinutes - Duration in minutes
 * @returns {string} End time in HH:mm format
 *
 * @example
 * calculateEndTime('09:00', 90); // Returns '10:30'
 * calculateEndTime('23:00', 120); // Returns '01:00'
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const totalMinutes = startHour * 60 + startMin + durationMinutes;

    const endHour = Math.floor(totalMinutes / 60) % 24;
    const endMin = totalMinutes % 60;

    return `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
}

/**
 * Formats a duration in minutes to a human-readable string.
 *
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted string (e.g., "45m", "2h", "1h 30m")
 *
 * @example
 * formatDuration(45);  // Returns '45m'
 * formatDuration(120); // Returns '2h'
 * formatDuration(90);  // Returns '1h 30m'
 */
export function formatDuration(minutes: number): string {
    if (minutes < 60) {
        return `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (mins === 0) {
        return `${hours}h`;
    }

    return `${hours}h ${mins}m`;
}

/**
 * Estimates the number of Pomodoro sessions needed for a given duration.
 * Assumes standard 25-minute Pomodoro sessions.
 *
 * @param {number} durationMinutes - Total duration in minutes
 * @returns {number} Estimated number of Pomodoro sessions (rounded up)
 *
 * @example
 * estimatePomodoros(50);  // Returns 2
 * estimatePomodoros(30);  // Returns 2
 * estimatePomodoros(25);  // Returns 1
 */
export function estimatePomodoros(durationMinutes: number): number {
    return Math.ceil(durationMinutes / 25);
}

/**
 * Suggests available time slots for a new task based on existing task schedules.
 * Finds gaps in the schedule that can accommodate the requested duration.
 *
 * @param {Task[]} tasks - Array of existing tasks to check against
 * @param {Date} date - The date to find available slots for
 * @param {number} durationMinutes - Required duration in minutes
 * @param {number} [workStartHour=9] - Start of work day (0-23)
 * @param {number} [workEndHour=18] - End of work day (0-23)
 * @returns {Array<{startTime: string, endTime: string}>} Up to 3 suggested time slots
 *
 * @example
 * const slots = suggestTimeSlots(tasks, new Date(), 60, 9, 18);
 * // Returns: [{ startTime: '09:00', endTime: '10:00' }, ...]
 */
export function suggestTimeSlots(
    tasks: Task[],
    date: Date,
    durationMinutes: number,
    workStartHour: number = 9,
    workEndHour: number = 18
): { startTime: string; endTime: string }[] {
    const suggestions: { startTime: string; endTime: string }[] = [];

    // Get tasks for the specific date
    const dayTasks = tasks.filter(task => {
        if (!task.startDate || !task.startTime || !task.endTime || task.completed) {
            return false;
        }

        const taskDate = new Date(task.startDate);
        taskDate.setHours(0, 0, 0, 0);

        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);

        return taskDate.getTime() === checkDate.getTime();
    });

    // Sort tasks by start time
    const sortedTasks = dayTasks.sort((a, b) => {
        if (!a.startTime || !b.startTime) return 0;
        const [aHour, aMin] = a.startTime.split(':').map(Number);
        const [bHour, bMin] = b.startTime.split(':').map(Number);
        return (aHour * 60 + aMin) - (bHour * 60 + bMin);
    });

    // Find gaps between tasks
    let currentTime = workStartHour * 60; // Start of work day in minutes

    for (const task of sortedTasks) {
        if (!task.startTime || !task.endTime) continue;

        const [taskStartHour, taskStartMin] = task.startTime.split(':').map(Number);
        const [taskEndHour, taskEndMin] = task.endTime.split(':').map(Number);

        const taskStart = taskStartHour * 60 + taskStartMin;
        const taskEnd = taskEndHour * 60 + taskEndMin;

        // Check if there's a gap before this task
        if (taskStart - currentTime >= durationMinutes) {
            const startHour = Math.floor(currentTime / 60);
            const startMin = currentTime % 60;
            const endTime = currentTime + durationMinutes;
            const endHour = Math.floor(endTime / 60);
            const endMin = endTime % 60;

            suggestions.push({
                startTime: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`,
                endTime: `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`
            });
        }

        currentTime = Math.max(currentTime, taskEnd);
    }

    // Check if there's a gap after the last task
    const workEnd = workEndHour * 60;
    if (workEnd - currentTime >= durationMinutes) {
        const startHour = Math.floor(currentTime / 60);
        const startMin = currentTime % 60;
        const endTime = currentTime + durationMinutes;
        const endHour = Math.floor(endTime / 60);
        const endMin = endTime % 60;

        suggestions.push({
            startTime: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`,
            endTime: `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`
        });
    }

    return suggestions.slice(0, 3); // Return top 3 suggestions
}
