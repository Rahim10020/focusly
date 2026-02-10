/**
 * @fileoverview SubTask CRUD operations hook.
 * Provides add, toggle, delete operations for subtasks.
 */

import { useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Task, SubTask } from '@/types';
import { supabaseClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';
import { retryWithBackoff } from '@/lib/utils/retry';

interface UseSubTaskActionsReturn {
    addSubTask: (taskId: string, title: string) => Promise<void>;
    toggleSubTask: (taskId: string, subTaskId: string) => Promise<void>;
    deleteSubTask: (taskId: string, subTaskId: string) => Promise<void>;
}

interface UseSubTaskActionsProps {
    tasks: Task[];
    setTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void;
}

export function useSubTaskActions({
    tasks,
    setTasks,
}: UseSubTaskActionsProps): UseSubTaskActionsReturn {
    const { data: session } = useSession();

    const getUserId = useCallback(() => session?.user?.id, [session]);
    const typedSupabaseClient: SupabaseClient<Database> = supabaseClient;

    const addSubTask = useCallback(async (taskId: string, title: string) => {
        const newSubTask: SubTask = {
            id: `subtask-${Date.now()}`,
            title,
            completed: false,
            createdAt: Date.now(),
        };

        const userId = getUserId();
        if (userId) {
            try {
                const { data, error } = await retryWithBackoff(async () => {
                    const result = await typedSupabaseClient
                        .from('subtasks')
                        .insert({
                            task_id: taskId,
                            title: newSubTask.title,
                            completed: newSubTask.completed,
                            created_at: new Date(newSubTask.createdAt).toISOString(),
                        })
                        .select()
                        .single();
                    if (result.error) throw result.error;
                    return result;
                });

                if (error) throw error;
                const createdSubTask = data as Database['public']['Tables']['subtasks']['Row'] | null;
                if (!createdSubTask) throw new Error('No data returned when creating subtask');
                newSubTask.id = createdSubTask.id;
                setTasks(prevTasks =>
                    prevTasks.map(task =>
                        task.id === taskId
                            ? { ...task, subTasks: [...(task.subTasks || []), newSubTask] }
                            : task
                    )
                );
            } catch (error: unknown) {
                console.error('Error adding subtask to DB:', error);
                setTasks(prevTasks =>
                    prevTasks.map(task =>
                        task.id === taskId
                            ? { ...task, subTasks: [...(task.subTasks || []), newSubTask] }
                            : task
                    )
                );
            }
        } else {
            setTasks(prevTasks =>
                prevTasks.map(task =>
                    task.id === taskId
                        ? { ...task, subTasks: [...(task.subTasks || []), newSubTask] }
                        : task
                )
            );
        }
    }, [getUserId, setTasks, typedSupabaseClient]);

    const toggleSubTask = useCallback(async (taskId: string, subTaskId: string) => {
        const userId = getUserId();
        const subTask = tasks.find(t => t.id === taskId)?.subTasks?.find(st => st.id === subTaskId);
        if (!subTask) return;

        const newCompleted = !subTask.completed;

        // Optimistic update
        setTasks(prevTasks =>
            prevTasks.map(task =>
                task.id === taskId
                    ? {
                        ...task,
                        subTasks: (task.subTasks || []).map(st =>
                            st.id === subTaskId
                                ? { ...st, completed: newCompleted, completedAt: newCompleted ? Date.now() : undefined }
                                : st
                        )
                    }
                    : task
            )
        );

        if (userId) {
            try {
                await typedSupabaseClient
                    .from('subtasks')
                    .update({
                        completed: newCompleted,
                        completed_at: newCompleted ? new Date().toISOString() : null,
                    })
                    .eq('id', subTaskId);
            } catch (error: unknown) {
                console.error('Error toggling subtask in DB:', error);
            }
        }
    }, [tasks, getUserId, setTasks, typedSupabaseClient]);

    const deleteSubTask = useCallback(async (taskId: string, subTaskId: string) => {
        const userId = getUserId();

        // Optimistic update
        setTasks(prevTasks =>
            prevTasks.map(task =>
                task.id === taskId
                    ? { ...task, subTasks: (task.subTasks || []).filter(st => st.id !== subTaskId) }
                    : task
            )
        );

        if (userId) {
            try {
                await typedSupabaseClient
                    .from('subtasks')
                    .delete()
                    .eq('id', subTaskId);
            } catch (error: unknown) {
                console.error('Error deleting subtask from DB:', error);
            }
        }
    }, [getUserId, setTasks, typedSupabaseClient]);

    return {
        addSubTask,
        toggleSubTask,
        deleteSubTask,
    };
}
