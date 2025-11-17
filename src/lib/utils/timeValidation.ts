import { Task } from '@/types';

export interface TimeValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

export interface TimeOverlapResult {
    hasOverlap: boolean;
    overlappingTasks: Task[];
}

/**
 * Validates time range (start time must be before end time)
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
 * Validates date range (start date must be before or equal to due date)
 */
export function validateDateRange(startDate?: number, dueDate?: number): TimeValidationResult {
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
 * Checks for time slot overlaps with existing tasks
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
 * Calculate duration in minutes from start and end times
 */
export function calculateDuration(startTime: string, endTime: string): number {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    return Math.max(0, endMinutes - startMinutes);
}

/**
 * Auto-calculate end time based on start time and duration
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const totalMinutes = startHour * 60 + startMin + durationMinutes;

    const endHour = Math.floor(totalMinutes / 60) % 24;
    const endMin = totalMinutes % 60;

    return `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
}

/**
 * Format duration in minutes to human-readable string
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
 * Estimate Pomodoro count based on duration (assumes 25-min pomodoros)
 */
export function estimatePomodoros(durationMinutes: number): number {
    return Math.ceil(durationMinutes / 25);
}

/**
 * Suggests optimal time slots based on existing tasks
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
