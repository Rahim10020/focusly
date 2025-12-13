/**
 * @fileoverview Service for categorizing tasks by their status.
 * Provides accurate task classification and statistics calculation.
 */

import { Task } from '@/types';

export interface CategorizedTasks {
    active: Task[];
    inProgress: Task[];
    upcoming: Task[];
    completed: Task[];
    failed: Task[];
    overdue: Task[];
    postponed: Task[];
    cancelled: Task[];
}

export interface TaskStats {
    total: number;
    completed: number;
    failed: number;
    overdue: number;
    postponed: number;
    cancelled: number;
    completionRate: number;
    failureRate: number;
}

export class TaskCategorizationService {
    /**
     * Categorize tasks into different status groups
     */
    static categorizeTasks(tasks: Task[]): CategorizedTasks {
        const now = new Date();

        // inProgress: tasks explicitly marked as in-progress (and not completed/failed)
        const inProgress = tasks.filter(t => (t.status === 'in-progress') && !t.completed && !t.failedAt);

        // upcoming: tasks with a dueDate in the future and not completed/failed
        const upcoming = tasks.filter(t =>
            !!t.dueDate &&
            t.dueDate > now.getTime() &&
            !t.completed &&
            !t.failedAt
        );

        return {
            active: tasks.filter(t => t.status === 'todo' || t.status === 'in-progress'),
            inProgress,
            upcoming,
            completed: tasks.filter(t => t.status === 'done' || t.completed),
            failed: tasks.filter(t => t.failedAt !== undefined),
            overdue: tasks.filter(t =>
                (t.status === 'todo' || t.status === 'in-progress') &&
                !t.completed &&
                t.dueDate &&
                t.dueDate < now.getTime()
            ),
            postponed: tasks.filter(t => t.status === 'postponed'),
            cancelled: tasks.filter(t => t.status === 'cancelled')
        };
    }

    /**
     * Calculate accurate task statistics
     */
    static calculateAccurateStats(tasks: Task[]): TaskStats {
        const categorized = this.categorizeTasks(tasks);
        const activeTasks = tasks.length - (categorized.cancelled?.length || 0);

        return {
            total: tasks.length,
            completed: categorized.completed.length,
            failed: categorized.failed.length,
            overdue: categorized.overdue.length,
            postponed: categorized.postponed?.length || 0,
            cancelled: categorized.cancelled?.length || 0,
            completionRate: activeTasks > 0
                ? (categorized.completed.length / activeTasks) * 100
                : 0,
            failureRate: activeTasks > 0
                ? (categorized.failed.length / activeTasks) * 100
                : 0
        };
    }
}
