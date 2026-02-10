/**
 * @fileoverview Task filters and sorting hook.
 * Provides filtering and sorting functions for tasks.
 */

import { useCallback } from 'react';
import { Task, Priority } from '@/types';

interface UseTaskFiltersReturn {
    getActiveTasks: () => Task[];
    getCompletedTasks: () => Task[];
    getTasksByPriority: (priority: Priority) => Task[];
    getTasksByTag: (tagId: string) => Task[];
    getOverdueTasks: () => Task[];
    getTasksDueToday: () => Task[];
    sortTasksByPriority: (tasksToSort: Task[]) => Task[];
    sortTasksByOrder: (tasksToSort: Task[]) => Task[];
}

interface UseTaskFiltersProps {
    tasks: Task[];
}

export function useTaskFilters({
    tasks,
}: UseTaskFiltersProps): UseTaskFiltersReturn {
    const getActiveTasks = useCallback(() => {
        return tasks.filter(task => !task.completed);
    }, [tasks]);

    const getCompletedTasks = useCallback(() => {
        return tasks.filter(task => task.completed);
    }, [tasks]);

    const getTasksByPriority = useCallback((priority: Priority) => {
        return tasks.filter(task => task.priority === priority && !task.completed);
    }, [tasks]);

    const getTasksByTag = useCallback((tagId: string) => {
        return tasks.filter(task => task.tags?.includes(tagId) && !task.completed);
    }, [tasks]);

    const getOverdueTasks = useCallback(() => {
        const now = Date.now();
        return tasks.filter(task => task.dueDate && task.dueDate < now && !task.completed);
    }, [tasks]);

    const getTasksDueToday = useCallback(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return tasks.filter(task =>
            task.dueDate &&
            task.dueDate >= today.getTime() &&
            task.dueDate < tomorrow.getTime() &&
            !task.completed
        );
    }, [tasks]);

    const sortTasksByPriority = useCallback((tasksToSort: Task[]) => {
        const priorityOrder = { high: 0, medium: 1, low: 2, undefined: 3 };
        return [...tasksToSort].sort((a, b) => {
            const aPriority = a.priority || 'undefined';
            const bPriority = b.priority || 'undefined';
            return priorityOrder[aPriority] - priorityOrder[bPriority];
        });
    }, []);

    const sortTasksByOrder = useCallback((tasksToSort: Task[]) => {
        return [...tasksToSort].sort((a, b) => (a.order || 0) - (b.order || 0));
    }, []);

    return {
        getActiveTasks,
        getCompletedTasks,
        getTasksByPriority,
        getTasksByTag,
        getOverdueTasks,
        getTasksDueToday,
        sortTasksByPriority,
        sortTasksByOrder,
    };
}
