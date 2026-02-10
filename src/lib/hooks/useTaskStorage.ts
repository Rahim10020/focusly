/**
 * @fileoverview Task storage abstraction layer.
 * Handles switching between localStorage and Supabase based on authentication state.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Task, SubTask } from '@/types';
import { useLocalStorage } from './useLocalStorage';
import { supabaseClient } from '@/lib/supabase/client';
import { retryWithBackoff } from '@/lib/utils/retry';
import { dateUtils } from '@/lib/utils/dateUtils';
import { SubDomain, Priority } from '@/types';
import { logger } from '@/lib/logger';

interface UseTaskStorageReturn {
    tasks: Task[];
    setTasks: (tasks: Task[]) => void;
    loading: boolean;
    error: string | null;
    loadTasks: () => Promise<void>;
}

interface DbTask {
    id: string;
    title: string;
    completed: boolean;
    created_at: string;
    completed_at?: string;
    pomodoro_count: number;
    priority: Priority;
    tags?: string[];
    due_date?: string;
    start_date?: string;
    start_time?: string;
    end_time?: string;
    estimated_duration?: number;
    notes?: string;
    subtasks?: DbSubTask[];
    order?: number;
    sub_domain?: SubDomain;
    version?: number;
}

interface DbSubTask {
    id: string;
    title: string;
    completed: boolean;
    created_at: string;
    completed_at?: string;
}

export function useTaskStorage(storageKey: string): UseTaskStorageReturn {
    const { data: session } = useSession();
    const [localTasks, setLocalTasks] = useLocalStorage<Task[]>(storageKey, []);
    const [dbTasks, setDbTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getUserId = useCallback(() => session?.user?.id, [session]);

    const isAuthenticated = !!getUserId();
    const tasks = isAuthenticated ? dbTasks : localTasks;
    const setTasks = isAuthenticated ? setDbTasks : setLocalTasks;

    const formatDbTask = useCallback((dbTask: DbTask): Task => ({
        id: dbTask.id,
        title: dbTask.title,
        completed: dbTask.completed,
        createdAt: dateUtils.toTimestamp(dbTask.created_at),
        completedAt: dbTask.completed_at ? dateUtils.toTimestamp(dbTask.completed_at) : undefined,
        pomodoroCount: dbTask.pomodoro_count,
        priority: dbTask.priority,
        tags: dbTask.tags || [],
        dueDate: dbTask.due_date ? dateUtils.toTimestamp(dbTask.due_date) : undefined,
        startDate: dbTask.start_date ? dateUtils.toTimestamp(dbTask.start_date) : undefined,
        startTime: dbTask.start_time,
        endTime: dbTask.end_time,
        estimatedDuration: dbTask.estimated_duration,
        notes: dbTask.notes,
        subTasks: dbTask.subtasks?.map((st: DbSubTask): SubTask => ({
            id: st.id,
            title: st.title,
            completed: st.completed,
            createdAt: dateUtils.toTimestamp(st.created_at),
            completedAt: st.completed_at ? dateUtils.toTimestamp(st.completed_at) : undefined,
        })) || [],
        order: dbTask.order,
        subDomain: dbTask.sub_domain,
        version: dbTask.version,
    }), []);

    const loadTasks = useCallback(async () => {
        const userId = getUserId();
        if (!userId) {
            setDbTasks([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data: tasksData, error: tasksError } = await retryWithBackoff(async () => {
                const result = await supabaseClient
                    .from('tasks')
                    .select('*, subtasks(*)')
                    .eq('user_id', userId)
                    .order('order', { ascending: true });
                if (result.error) throw result.error;
                return result;
            });

            if (tasksError) throw tasksError;

            const formattedTasks = tasksData.map(formatDbTask);
            setDbTasks(formattedTasks);
        } catch (err: unknown) {
            const error = err as Error;
            logger.error('Error loading tasks from DB', error, {
                action: 'loadTasks',
                userId: getUserId()
            });
            const errorMessage = error.message || 'Failed to load tasks';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [getUserId, formatDbTask]);

    // Load tasks when user logs in
    useEffect(() => {
        const userId = getUserId();
        if (userId) {
            loadTasks();
        } else {
            setDbTasks([]);
        }
    }, [getUserId, session?.user?.id, loadTasks]);

    return {
        tasks,
        setTasks,
        loading,
        error,
        loadTasks,
    };
}
