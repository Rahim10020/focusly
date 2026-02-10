/**
 * @fileoverview Active task management hook.
 * Provides functionality to set and get the currently active task.
 */

import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Task } from '@/types';

interface UseActiveTaskReturn {
    activeTaskId: string | null;
    setActiveTask: (id: string | null) => void;
    getActiveTask: () => Task | null;
}

interface UseActiveTaskProps {
    tasks: Task[];
}

export function useActiveTask({
    tasks,
}: UseActiveTaskProps): UseActiveTaskReturn {
    const [activeTaskId, setActiveTaskId] = useLocalStorage<string | null>('focusly_active_task', null);

    const setActiveTask = useCallback((id: string | null) => {
        if (id) {
            const task = tasks.find(t => t.id === id);
            if (task && !task.completed) {
                setActiveTaskId(id);
            }
        } else {
            setActiveTaskId(null);
        }
    }, [tasks, setActiveTaskId]);

    const getActiveTask = useCallback(() => {
        if (!activeTaskId) return null;
        return tasks.find(task => task.id === activeTaskId) || null;
    }, [tasks, activeTaskId]);

    return {
        activeTaskId,
        setActiveTask,
        getActiveTask,
    };
}
