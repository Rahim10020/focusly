/**
 * @fileoverview Task CRUD operations and management hook.
 * Provides comprehensive task management with support for local storage
 * and Supabase database synchronization, including subtasks, priorities,
 * tags, and drag-and-drop reordering.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useLocalStorage } from './useLocalStorage';
import { Task, SubTask, Priority, SubDomain } from '@/types';
import { CreateTaskInput } from '@/types/task-input';
import { STORAGE_KEYS } from '@/lib/constants';
import { supabaseClient } from '@/lib/supabase/client';
import { retryWithBackoff } from '@/lib/utils/retry';
import { dateUtils } from '@/lib/utils/dateUtils';
import { useToastContext } from '@/components/providers/ToastProvider';
import { logger } from '@/lib/logger';

/**
 * Hook for managing tasks with full CRUD operations.
 * Automatically syncs with Supabase when authenticated, falls back to localStorage otherwise.
 * Supports subtasks, priorities, tags, due dates, and optimistic locking for concurrent updates.
 *
 * @returns {Object} Task state and management functions
 * @returns {Task[]} returns.tasks - Array of all tasks
 * @returns {string|null} returns.activeTaskId - ID of the currently active task
 * @returns {boolean} returns.loading - Whether tasks are being loaded
 * @returns {string|null} returns.error - Error message if any
 * @returns {Function} returns.addTask - Add a new task
 * @returns {Function} returns.updateTask - Update an existing task
 * @returns {Function} returns.deleteTask - Delete a task
 * @returns {Function} returns.toggleTask - Toggle task completion status
 * @returns {Function} returns.incrementPomodoro - Increment pomodoro count for a task
 * @returns {Function} returns.addSubTask - Add a subtask to a task
 * @returns {Function} returns.toggleSubTask - Toggle subtask completion
 * @returns {Function} returns.deleteSubTask - Delete a subtask
 * @returns {Function} returns.reorderTasks - Reorder tasks via drag and drop
 * @returns {Function} returns.setActiveTask - Set the active task
 * @returns {Function} returns.getActiveTask - Get the current active task
 * @returns {Function} returns.getActiveTasks - Get all incomplete tasks
 * @returns {Function} returns.getCompletedTasks - Get all completed tasks
 * @returns {Function} returns.getTasksByPriority - Filter tasks by priority
 * @returns {Function} returns.getTasksByTag - Filter tasks by tag
 * @returns {Function} returns.getOverdueTasks - Get all overdue tasks
 * @returns {Function} returns.getTasksDueToday - Get tasks due today
 * @returns {Function} returns.sortTasksByPriority - Sort tasks by priority
 * @returns {Function} returns.sortTasksByOrder - Sort tasks by order
 *
 * @example
 * const { tasks, addTask, toggleTask, deleteTask } = useTasks();
 *
 * // Add a new task
 * await addTask({
 *   title: 'Complete project',
 *   priority: 'high',
 *   tags: ['work'],
 *   dueDate: Date.now() + 86400000
 * });
 *
 * // Toggle task completion
 * await toggleTask('task-123');
 */
export function useTasks() {
    const { data: session } = useSession();
    const { error: showErrorToast } = useToastContext();
    const [tasks, setTasks] = useLocalStorage<Task[]>(STORAGE_KEYS.TASKS, []);
    const [activeTaskId, setActiveTaskId] = useLocalStorage<string | null>('focusly_active_task', null);
    const [dbTasks, setDbTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getUserId = () => session?.user?.id;

    // Set Supabase auth session when user logs in
    useEffect(() => {
        if (session?.accessToken && session?.refreshToken) {
            supabaseClient.auth.setSession({
                access_token: session.accessToken,
                refresh_token: session.refreshToken,
            });
        }
    }, [session]);

    const loadTasksFromDB = useCallback(async () => {
        const userId = getUserId();
        if (!userId) return;

        setLoading(true);
        setError(null);
        try {
            const { data: tasksData, error: tasksError } = await retryWithBackoff(async () => {
                const result = await supabaseClient
                    .from('tasks')
                    .select(`
                        *,
                        subtasks (*)
                    `)
                    .eq('user_id', userId)
                    .order('order', { ascending: true });
                if (result.error) throw result.error;
                return result;
            });

            if (tasksError) throw tasksError;

            // Get current versions for optimistic locking
            const { data: versionsData, error: versionsError } = await retryWithBackoff(async () => {
                const result = await supabaseClient
                    .from('tasks')
                    .select('id, version')
                    .eq('user_id', userId);
                if (result.error) throw result.error;
                return result;
            });

            if (versionsError) throw versionsError;

            const formattedTasks: Task[] = tasksData.map((dbTask: any) => ({
                id: dbTask.id,
                title: dbTask.title,
                completed: dbTask.completed,
                createdAt: dateUtils.toTimestamp(dbTask.created_at),
                completedAt: dbTask.completed_at ? dateUtils.toTimestamp(dbTask.completed_at) : undefined,
                pomodoroCount: dbTask.pomodoro_count,
                priority: dbTask.priority as Priority,
                tags: dbTask.tags || [],
                dueDate: dbTask.due_date ? dateUtils.toTimestamp(dbTask.due_date) : undefined,
                startDate: dbTask.start_date ? dateUtils.toTimestamp(dbTask.start_date) : undefined,
                startTime: dbTask.start_time,
                endTime: dbTask.end_time,
                estimatedDuration: dbTask.estimated_duration,
                notes: dbTask.notes,
                subTasks: dbTask.subtasks?.map((st: any) => ({
                    id: st.id,
                    title: st.title,
                    completed: st.completed,
                    createdAt: dateUtils.toTimestamp(st.created_at),
                    completedAt: st.completed_at ? dateUtils.toTimestamp(st.completed_at) : undefined,
                })) || [],
                order: dbTask.order,
                subDomain: dbTask.sub_domain as SubDomain,
                version: dbTask.version,
            }));

            setDbTasks(formattedTasks);
        } catch (error: any) {
            logger.error('Error loading tasks from DB', error, {
                action: 'loadTasksFromDB',
                userId: getUserId()
            });
            const errorMessage = error.message || 'Failed to load tasks from database';
            setError(errorMessage);
            showErrorToast('Failed to Load Tasks', errorMessage);
        } finally {
            setLoading(false);
        }
    }, [showErrorToast]);

    // Load tasks from database when user logs in
    useEffect(() => {
        const userId = getUserId();
        if (userId) {
            loadTasksFromDB();
        } else {
            setDbTasks([]);
        }
    }, [session?.user?.id, loadTasksFromDB]);

    const currentTasks = getUserId() ? dbTasks : tasks;
    const setCurrentTasks = getUserId() ? setDbTasks : setTasks;

    /**
     * Add a new task
     * @param input - Task creation input with all task properties
     */
    const addTask = async (input: CreateTaskInput) => {
        const maxOrder = currentTasks.length > 0 ? Math.max(...currentTasks.map(t => t.order || 0)) : 0;
        const newTask: Task = {
            id: Date.now().toString(),
            title: input.title,
            completed: false,
            createdAt: Date.now(),
            pomodoroCount: 0,
            priority: input.priority,
            tags: input.tags || [],
            dueDate: input.dueDate,
            startDate: input.scheduling?.startDate,
            startTime: input.scheduling?.startTime,
            endTime: input.scheduling?.endTime,
            estimatedDuration: input.scheduling?.estimatedDuration,
            notes: input.notes,
            subTasks: [],
            order: maxOrder + 1,
            subDomain: input.subDomain,
        };

        const userId = getUserId();
        if (userId) {
            // Save to database
            try {
                const insertData = {
                    user_id: userId,
                    title: newTask.title,
                    completed: newTask.completed,
                    created_at: new Date(newTask.createdAt).toISOString(),
                    pomodoro_count: newTask.pomodoroCount,
                    priority: newTask.priority,
                    tags: newTask.tags,
                    due_date: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : null,
                    start_date: newTask.startDate ? new Date(newTask.startDate).toISOString() : null,
                    start_time: newTask.startTime,
                    end_time: newTask.endTime,
                    estimated_duration: newTask.estimatedDuration,
                    notes: newTask.notes,
                    order: newTask.order,
                    sub_domain: newTask.subDomain,
                };

                const { data, error } = await retryWithBackoff(async () => {
                    const result = await (supabaseClient
                        .from('tasks') as any)
                        .insert(insertData)
                        .select()
                        .single();
                    if (result.error) throw result.error;
                    return result;
                });

                if (error) throw error;

                newTask.id = data.id;
                setCurrentTasks([...currentTasks, newTask]);
            } catch (error: any) {
                logger.error('Error adding task to DB', error, {
                    action: 'addTask',
                    userId: getUserId(),
                    taskTitle: input.title
                });
                const errorMessage = error.message || 'Failed to save task to database';
                showErrorToast('Failed to Add Task', errorMessage);
                // Still add to local state for offline functionality
                setCurrentTasks([...currentTasks, newTask]);
            }
        } else {
            // Save to localStorage
            setCurrentTasks([...currentTasks, newTask]);
        }
    };

    const updateTask = async (
        taskId: string,
        updates: Partial<Task>,
        maxRetries: number = 3
    ): Promise<void> => {
        const userId = getUserId();
        if (!userId) {
            // Update local only
            setCurrentTasks(prevTasks =>
                prevTasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
            );
            return;
        }

        let attempt = 0;
        let lastError: any;

        while (attempt < maxRetries) {
            try {
                // 1. Fetch current version
                const { data: currentTask, error: fetchError } = await retryWithBackoff(async () => {
                    const result = await (supabaseClient
                        .from('tasks') as any)
                        .select('id, version')
                        .eq('id', taskId)
                        .eq('user_id', userId)
                        .single();
                    if (result.error) throw result.error;
                    return result;
                });

                if (fetchError || !currentTask) {
                    throw fetchError || new Error('Task not found');
                }

                const currentVersion = currentTask.version || 1;

                // 2. Prepare updates - exclude status field and map camelCase to snake_case
                const { status, ...updatesToMap } = updates;

                // Map camelCase fields to snake_case for database
                const fieldMapping: Record<string, string> = {
                    completedAt: 'completed_at',
                    pomodoroCount: 'pomodoro_count',
                    dueDate: 'due_date',
                    startDate: 'start_date',
                    estimatedDuration: 'estimated_duration',
                    startTime: 'start_time',
                    endTime: 'end_time',
                    subDomain: 'sub_domain',
                };

                const dbUpdates: any = {};
                for (const [key, value] of Object.entries(updatesToMap)) {
                    const dbKey = fieldMapping[key] || key;
                    dbUpdates[dbKey] = value;
                }

                const taskUpdates: any = {
                    ...dbUpdates,
                    version: currentVersion + 1,
                    updated_at: new Date().toISOString(),
                };

                // 3. Attempt update with version check
                const { data: updatedTask, error: updateError } = await retryWithBackoff(async () => {
                    const result = await (supabaseClient
                        .from('tasks') as any)
                        .update(taskUpdates)
                        .eq('id', taskId)
                        .eq('version', currentVersion)
                        .select()
                        .single();
                    if (result.error) throw result.error;
                    return result;
                });

                if (updateError) {
                    // Check if it's a version conflict
                    if (updateError.code === 'PGRST116' || updateError.message?.includes('version')) {
                        lastError = new Error('Version conflict');
                        attempt++;
                        logger.warn('Version conflict, retrying...', {
                            action: 'updateTask',
                            taskId,
                            attempt,
                            currentVersion
                        });
                        // Exponential backoff
                        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
                        continue;
                    }
                    throw updateError;
                }

                // Success - update local state
                setCurrentTasks(prevTasks =>
                    prevTasks.map(t => t.id === taskId ? {
                        id: updatedTask.id,
                        title: updatedTask.title,
                        completed: updatedTask.completed,
                        createdAt: dateUtils.toTimestamp(updatedTask.created_at),
                        completedAt: updatedTask.completed_at ? dateUtils.toTimestamp(updatedTask.completed_at) : undefined,
                        pomodoroCount: updatedTask.pomodoro_count,
                        priority: updatedTask.priority as Priority,
                        tags: updatedTask.tags || [],
                        dueDate: updatedTask.due_date ? dateUtils.toTimestamp(updatedTask.due_date) : undefined,
                        startDate: updatedTask.start_date ? dateUtils.toTimestamp(updatedTask.start_date) : undefined,
                        startTime: updatedTask.start_time,
                        endTime: updatedTask.end_time,
                        estimatedDuration: updatedTask.estimated_duration,
                        notes: updatedTask.notes,
                        subTasks: t.subTasks || [], // keep existing subtasks
                        order: updatedTask.order,
                        subDomain: updatedTask.sub_domain as SubDomain,
                        version: updatedTask.version,
                    } : t)
                );

                logger.info('Task updated successfully', {
                    action: 'updateTask',
                    taskId,
                    attempt: attempt + 1
                });
                return;

            } catch (error: any) {
                lastError = error;
                attempt++;

                if (attempt >= maxRetries) {
                    break;
                }
            }
        }

        // All retries failed
        logger.error('Failed to update task after retries', lastError, {
            action: 'updateTask',
            taskId,
            attempts: maxRetries
        });

        showErrorToast(
            'Failed to save changes. The task may have been modified elsewhere. Please refresh.'
        );
        throw lastError;
    };

    const deleteTask = async (id: string) => {
        const userId = getUserId();
        if (userId) {
            // Delete from database
            try {
                const { error } = await retryWithBackoff(async () => {
                    const result = await supabaseClient
                        .from('tasks')
                        .delete()
                        .eq('id', id)
                        .eq('user_id', userId);
                    if (result.error) throw result.error;
                    return result;
                });

                if (error) throw error;

                setCurrentTasks(currentTasks.filter(task => task.id !== id));
            } catch (error: any) {
                logger.error('Error deleting task from DB', error, {
                    action: 'deleteTask',
                    userId: getUserId(),
                    taskId: id
                });
                const errorMessage = error.message || 'Failed to delete task from database';
                showErrorToast('Failed to Delete Task', errorMessage);
                // Don't delete from local state if DB delete failed
                return;
            }
        } else {
            // Delete from localStorage
            setCurrentTasks(currentTasks.filter(task => task.id !== id));
        }

        if (activeTaskId === id) {
            setActiveTaskId(null);
        }
    };

    const toggleTask = async (id: string) => {
        const task = currentTasks.find(t => t.id === id);
        if (!task) return;

        const newCompleted = !task.completed;
        const userId = getUserId();

        if (userId) {
            // Update in database with optimistic locking
            try {
                const { data, error } = await retryWithBackoff(async () => {
                    const result = await (supabaseClient
                        .from('tasks') as any)
                        .update({
                            completed: newCompleted,
                            completed_at: newCompleted ? new Date().toISOString() : null
                        })
                        .eq('id', id)
                        .eq('user_id', userId)
                        .eq('version', task.version || 1)
                        .select('version')
                        .single();
                    if (result.error) throw result.error;
                    return result;
                });

                if (error) {
                    if (error.code === 'PGRST116') { // No rows updated - version conflict
                        showErrorToast('Conflict Detected', 'Task was modified by another session. Please refresh and try again.');
                        loadTasksFromDB();
                        return;
                    }
                    throw error;
                }

                setCurrentTasks(currentTasks.map(t =>
                    t.id === id
                        ? {
                            ...t,
                            completed: newCompleted,
                            completedAt: newCompleted ? Date.now() : undefined,
                            version: data.version
                        }
                        : t
                ));
            } catch (error: any) {
                console.error('Error toggling task in DB:', error);
                const errorMessage = error.message || 'Failed to update task status in database';
                showErrorToast('Failed to Update Task', errorMessage);
                // Still update local state for offline functionality
                setCurrentTasks(currentTasks.map(t =>
                    t.id === id
                        ? {
                            ...t,
                            completed: newCompleted,
                            completedAt: newCompleted ? Date.now() : undefined
                        }
                        : t
                ));
            }
        } else {
            // Update in localStorage
            setCurrentTasks(currentTasks.map(t =>
                t.id === id
                    ? {
                        ...t,
                        completed: newCompleted,
                        completedAt: newCompleted ? Date.now() : undefined
                    }
                    : t
            ));
        }

        if (!newCompleted && activeTaskId === id) {
            setActiveTaskId(null);
        }
    };

    const incrementPomodoro = async (id: string) => {
        const task = currentTasks.find(t => t.id === id);
        if (!task) return;

        const newCount = task.pomodoroCount + 1;
        const userId = getUserId();

        if (userId) {
            // Update in database with optimistic locking
            try {
                const { data, error } = await retryWithBackoff(async () => {
                    const result = await (supabaseClient
                        .from('tasks') as any)
                        .update({ pomodoro_count: newCount })
                        .eq('id', id)
                        .eq('user_id', userId)
                        .eq('version', task.version || 1)
                        .select('version')
                        .single();
                    if (result.error) throw result.error;
                    return result;
                });

                if (error) {
                    if (error.code === 'PGRST116') { // No rows updated - version conflict
                        showErrorToast('Conflict Detected', 'Task was modified by another session. Please refresh and try again.');
                        loadTasksFromDB();
                        return;
                    }
                    throw error;
                }

                setCurrentTasks(currentTasks.map(t =>
                    t.id === id
                        ? { ...t, pomodoroCount: newCount, version: data.version }
                        : t
                ));
            } catch (error: any) {
                console.error('Error incrementing pomodoro in DB:', error);
                const errorMessage = error.message || 'Failed to update pomodoro count in database';
                showErrorToast('Failed to Update Pomodoro', errorMessage);
                // Still update local state for offline functionality
                setCurrentTasks(currentTasks.map(t =>
                    t.id === id
                        ? { ...t, pomodoroCount: newCount }
                        : t
                ));
            }
        } else {
            // Update in localStorage
            setCurrentTasks(currentTasks.map(t =>
                t.id === id
                    ? { ...t, pomodoroCount: newCount }
                    : t
            ));
        }
    };

    // SubTask management
    const addSubTask = async (taskId: string, title: string) => {
        const newSubTask: SubTask = {
            id: `subtask-${Date.now()}`,
            title,
            completed: false,
            createdAt: Date.now(),
        };

        const userId = getUserId();
        if (userId) {
            // Add to database
            try {
                const { data, error } = await retryWithBackoff(async () => {
                    const result = await (supabaseClient
                        .from('subtasks') as any)
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

                newSubTask.id = data.id;
                setCurrentTasks(currentTasks.map(task =>
                    task.id === taskId
                        ? { ...task, subTasks: [...(task.subTasks || []), newSubTask] }
                        : task
                ));
            } catch (error: any) {
                console.error('Error adding subtask to DB:', error);
                const errorMessage = error.message || 'Failed to add subtask to database';
                showErrorToast('Failed to Add Subtask', errorMessage);
                // Still add to local state for offline functionality
                setCurrentTasks(currentTasks.map(task =>
                    task.id === taskId
                        ? { ...task, subTasks: [...(task.subTasks || []), newSubTask] }
                        : task
                ));
            }
        } else {
            // Add to localStorage
            setCurrentTasks(currentTasks.map(task =>
                task.id === taskId
                    ? { ...task, subTasks: [...(task.subTasks || []), newSubTask] }
                    : task
            ));
        }
    };

    const toggleSubTask = async (taskId: string, subTaskId: string) => {
        const userId = getUserId();
        const subTask = currentTasks.find(t => t.id === taskId)?.subTasks?.find(st => st.id === subTaskId);
        if (!subTask) return;

        const newCompleted = !subTask.completed;

        if (userId) {
            // Update in database
            try {
                const { error } = await retryWithBackoff(async () => {
                    const result = await (supabaseClient
                        .from('subtasks') as any)
                        .update({
                            completed: newCompleted,
                            completed_at: newCompleted ? new Date().toISOString() : null
                        })
                        .eq('id', subTaskId);
                    if (result.error) throw result.error;
                    return result;
                });

                if (error) throw error;

                setCurrentTasks(currentTasks.map(task =>
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
                ));
            } catch (error: any) {
                console.error('Error toggling subtask in DB:', error);
            }
        } else {
            // Update in localStorage
            setCurrentTasks(currentTasks.map(task =>
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
            ));
        }
    };

    const deleteSubTask = async (taskId: string, subTaskId: string) => {
        const userId = getUserId();
        if (userId) {
            // Delete from database
            try {
                const { error } = await retryWithBackoff(async () => {
                    const result = await (supabaseClient
                        .from('subtasks') as any)
                        .delete()
                        .eq('id', subTaskId);
                    if (result.error) throw result.error;
                    return result;
                });

                if (error) throw error;

                setCurrentTasks(currentTasks.map(task =>
                    task.id === taskId
                        ? { ...task, subTasks: (task.subTasks || []).filter(st => st.id !== subTaskId) }
                        : task
                ));
            } catch (error: any) {
                console.error('Error deleting subtask from DB:', error);
            }
        } else {
            // Delete from localStorage
            setCurrentTasks(currentTasks.map(task =>
                task.id === taskId
                    ? { ...task, subTasks: (task.subTasks || []).filter(st => st.id !== subTaskId) }
                    : task
            ));
        }
    };

    // Drag & Drop
    const reorderTasks = async (startIndex: number, endIndex: number) => {
        const sortedTasks = [...currentTasks].sort((a, b) => (a.order || 0) - (b.order || 0));
        const [removed] = sortedTasks.splice(startIndex, 1);
        sortedTasks.splice(endIndex, 0, removed);

        // Reassign order
        const reorderedTasks = sortedTasks.map((task, index) => ({
            ...task,
            order: index,
        }));

        const userId = getUserId();
        if (userId) {
            // Update orders in database
            try {
                const updates = reorderedTasks.map(task => ({
                    id: task.id,
                    order: task.order,
                }));

                // Update all tasks in parallel for better performance
                await Promise.all(
                    updates.map(update =>
                        retryWithBackoff(async () => {
                            const result = await (supabaseClient
                                .from('tasks') as any)
                                .update({ order: update.order })
                                .eq('id', update.id)
                                .eq('user_id', userId);
                            if (result.error) throw result.error;
                            return result;
                        })
                    )
                );

                setCurrentTasks(reorderedTasks);
            } catch (error: any) {
                logger.error('Error reordering tasks in DB', error, {
                    action: 'reorderTasks',
                    userId: getUserId()
                });
            }
        } else {
            // Update in localStorage
            setCurrentTasks(reorderedTasks);
        }
    };

    const setActiveTask = (id: string | null) => {
        if (id) {
            const task = currentTasks.find(t => t.id === id);
            if (task && !task.completed) {
                setActiveTaskId(id);
            }
        } else {
            setActiveTaskId(null);
        }
    };

    const getActiveTask = () => {
        if (!activeTaskId) return null;
        return currentTasks.find(task => task.id === activeTaskId) || null;
    };

    const getActiveTasks = () => currentTasks.filter(task => !task.completed);
    const getCompletedTasks = () => currentTasks.filter(task => task.completed);

    const getTasksByPriority = (priority: Priority) => {
        return currentTasks.filter(task => task.priority === priority && !task.completed);
    };

    const getTasksByTag = (tagId: string) => {
        return currentTasks.filter(task => task.tags?.includes(tagId) && !task.completed);
    };

    const getOverdueTasks = () => {
        const now = Date.now();
        return currentTasks.filter(task => task.dueDate && task.dueDate < now && !task.completed);
    };

    const getTasksDueToday = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return currentTasks.filter(task =>
            task.dueDate &&
            task.dueDate >= today.getTime() &&
            task.dueDate < tomorrow.getTime() &&
            !task.completed
        );
    };

    const sortTasksByPriority = (tasksToSort: Task[]) => {
        const priorityOrder = { high: 0, medium: 1, low: 2, undefined: 3 };
        return [...tasksToSort].sort((a, b) => {
            const aPriority = a.priority || 'undefined';
            const bPriority = b.priority || 'undefined';
            return priorityOrder[aPriority] - priorityOrder[bPriority];
        });
    };

    const sortTasksByOrder = (tasksToSort: Task[]) => {
        return [...tasksToSort].sort((a, b) => (a.order || 0) - (b.order || 0));
    };

    return {
        tasks: currentTasks,
        activeTaskId,
        loading,
        error,
        addTask,
        updateTask,
        deleteTask,
        toggleTask,
        incrementPomodoro,
        addSubTask,
        toggleSubTask,
        deleteSubTask,
        reorderTasks,
        setActiveTask,
        getActiveTask,
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