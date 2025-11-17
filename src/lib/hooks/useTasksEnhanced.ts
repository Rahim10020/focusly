import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useLocalStorage } from './useLocalStorage';
import { Task, SubTask, Priority, SubDomain } from '@/types';
import { STORAGE_KEYS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { useToastContext } from '@/components/providers/ToastProvider';

/**
 * Enhanced useTasks hook with hierarchical task support
 */
export function useTasksEnhanced() {
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
            supabase.auth.setSession({
                access_token: session.accessToken,
                refresh_token: session.refreshToken,
            });
        }
    }, [session]);

    // Load tasks from database when user logs in
    useEffect(() => {
        const userId = getUserId();
        if (userId) {
            loadTasksFromDB();
        } else {
            setDbTasks([]);
        }
    }, [session?.user?.id]);

    /**
     * Recursively load tasks with their children
     */
    const loadTasksFromDB = async () => {
        const userId = getUserId();
        if (!userId) return;

        setLoading(true);
        setError(null);
        try {
            // Load all tasks (both parent and child tasks)
            const { data: tasksData, error: tasksError } = await supabase
                .from('tasks')
                .select(`
                    *,
                    subtasks (*)
                `)
                .eq('user_id', userId)
                .order('order', { ascending: true });

            if (tasksError) throw tasksError;

            // Format tasks with hierarchy
            const formattedTasks: Task[] = tasksData.map((dbTask: any) => ({
                id: dbTask.id,
                title: dbTask.title,
                completed: dbTask.completed,
                createdAt: new Date(dbTask.created_at).getTime(),
                completedAt: dbTask.completed_at ? new Date(dbTask.completed_at).getTime() : undefined,
                pomodoroCount: dbTask.pomodoro_count,
                priority: dbTask.priority as Priority,
                tags: dbTask.tags || [],
                dueDate: dbTask.due_date ? new Date(dbTask.due_date).getTime() : undefined,
                startDate: dbTask.start_date ? new Date(dbTask.start_date).getTime() : undefined,
                startTime: dbTask.start_time,
                endTime: dbTask.end_time,
                estimatedDuration: dbTask.estimated_duration,
                notes: dbTask.notes,
                subTasks: dbTask.subtasks?.map((st: any) => ({
                    id: st.id,
                    title: st.title,
                    completed: st.completed,
                    createdAt: new Date(st.created_at).getTime(),
                    completedAt: st.completed_at ? new Date(st.completed_at).getTime() : undefined,
                    order: st.order || 0,
                })) || [],
                order: dbTask.order,
                subDomain: dbTask.sub_domain as SubDomain,
                version: dbTask.version,
                parentId: dbTask.parent_id,
                progress: dbTask.progress || 0,
                reminderTime: dbTask.reminder_time ? new Date(dbTask.reminder_time).getTime() : undefined,
                reminderSent: dbTask.reminder_sent || false,
            }));

            // Build hierarchical structure
            const hierarchicalTasks = buildTaskHierarchy(formattedTasks);
            setDbTasks(hierarchicalTasks);
        } catch (error: any) {
            console.error('Error loading tasks from DB:', error);
            const errorMessage = error.message || 'Failed to load tasks from database';
            setError(errorMessage);
            showErrorToast('Failed to Load Tasks', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Build hierarchical task structure
     */
    const buildTaskHierarchy = (flatTasks: Task[]): Task[] => {
        const taskMap = new Map<string, Task>();
        const rootTasks: Task[] = [];

        // First pass: create task map
        flatTasks.forEach(task => {
            taskMap.set(task.id, { ...task, children: [], depth: 0, hasChildren: false });
        });

        // Second pass: build hierarchy
        taskMap.forEach(task => {
            if (task.parentId) {
                const parent = taskMap.get(task.parentId);
                if (parent) {
                    parent.children = parent.children || [];
                    parent.children.push(task);
                    parent.hasChildren = true;
                    task.depth = (parent.depth || 0) + 1;
                } else {
                    // Parent not found, treat as root
                    rootTasks.push(task);
                }
            } else {
                // Root task
                rootTasks.push(task);
            }
        });

        // Sort children by order
        const sortChildren = (task: Task) => {
            if (task.children && task.children.length > 0) {
                task.children.sort((a, b) => (a.order || 0) - (b.order || 0));
                task.children.forEach(sortChildren);
            }
        };

        rootTasks.forEach(sortChildren);
        return rootTasks.sort((a, b) => (a.order || 0) - (b.order || 0));
    };

    /**
     * Flatten hierarchical tasks for easier filtering
     */
    const flattenTasks = (tasks: Task[]): Task[] => {
        const result: Task[] = [];
        const flatten = (task: Task) => {
            result.push(task);
            task.children?.forEach(flatten);
        };
        tasks.forEach(flatten);
        return result;
    };

    const currentTasks = getUserId() ? dbTasks : tasks;
    const setCurrentTasks = getUserId() ? setDbTasks : setTasks;
    const flatTasks = flattenTasks(currentTasks);

    const addTask = async (
        title: string,
        priority?: Priority,
        tags?: string[],
        dueDate?: number,
        notes?: string,
        subDomain?: SubDomain,
        startDate?: number,
        startTime?: string,
        endTime?: string,
        estimatedDuration?: number,
        parentId?: string,
        reminderTime?: number
    ) => {
        const maxOrder = currentTasks.length > 0 ? Math.max(...flatTasks.map(t => t.order || 0)) : 0;
        const newTask: Task = {
            id: Date.now().toString(),
            title,
            completed: false,
            createdAt: Date.now(),
            pomodoroCount: 0,
            priority,
            tags: tags || [],
            dueDate,
            startDate,
            startTime,
            endTime,
            estimatedDuration,
            notes,
            subTasks: [],
            order: maxOrder + 1,
            subDomain,
            parentId,
            progress: 0,
            reminderTime,
            reminderSent: false,
            children: [],
            depth: 0,
            hasChildren: false,
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
                    parent_id: newTask.parentId,
                    progress: newTask.progress,
                    reminder_time: newTask.reminderTime ? new Date(newTask.reminderTime).toISOString() : null,
                    reminder_sent: newTask.reminderSent,
                };

                const { data, error } = await supabase
                    .from('tasks')
                    .insert(insertData)
                    .select()
                    .single();

                if (error) throw error;

                newTask.id = data.id;
                await loadTasksFromDB(); // Reload to rebuild hierarchy
            } catch (error: any) {
                console.error('Error adding task to DB:', error);
                const errorMessage = error.message || 'Failed to save task to database';
                showErrorToast('Failed to Add Task', errorMessage);
            }
        } else {
            // Save to localStorage
            setCurrentTasks([...currentTasks, newTask]);
        }
    };

    const updateTask = async (id: string, updates: Partial<Task>) => {
        const userId = getUserId();
        if (userId) {
            // Update in database with optimistic locking
            try {
                const currentTask = flatTasks.find(t => t.id === id);
                if (!currentTask) return;

                const updateData: any = {};
                if (updates.title !== undefined) updateData.title = updates.title;
                if (updates.completed !== undefined) {
                    updateData.completed = updates.completed;
                    updateData.completed_at = updates.completed ? new Date().toISOString() : null;
                }
                if (updates.pomodoroCount !== undefined) updateData.pomodoro_count = updates.pomodoroCount;
                if (updates.priority !== undefined) updateData.priority = updates.priority;
                if (updates.tags !== undefined) updateData.tags = updates.tags;
                if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate ? new Date(updates.dueDate).toISOString() : null;
                if (updates.startDate !== undefined) updateData.start_date = updates.startDate ? new Date(updates.startDate).toISOString() : null;
                if (updates.startTime !== undefined) updateData.start_time = updates.startTime;
                if (updates.endTime !== undefined) updateData.end_time = updates.endTime;
                if (updates.estimatedDuration !== undefined) updateData.estimated_duration = updates.estimatedDuration;
                if (updates.notes !== undefined) updateData.notes = updates.notes;
                if (updates.order !== undefined) updateData.order = updates.order;
                if (updates.subDomain !== undefined) updateData.sub_domain = updates.subDomain;
                if (updates.parentId !== undefined) updateData.parent_id = updates.parentId;
                if (updates.progress !== undefined) updateData.progress = updates.progress;
                if (updates.reminderTime !== undefined) updateData.reminder_time = updates.reminderTime ? new Date(updates.reminderTime).toISOString() : null;
                if (updates.reminderSent !== undefined) updateData.reminder_sent = updates.reminderSent;

                // Handle subtasks update separately
                if (updates.subTasks !== undefined) {
                    // Sync subtasks with database
                    await syncSubTasks(id, updates.subTasks);
                }

                // Use optimistic locking with version check
                const { data, error } = await supabase
                    .from('tasks')
                    .update(updateData)
                    .eq('id', id)
                    .eq('user_id', userId)
                    .eq('version', currentTask.version || 1)
                    .select('version')
                    .single();

                if (error) {
                    if (error.code === 'PGRST116') { // No rows updated - version conflict
                        showErrorToast('Conflict Detected', 'Task was modified by another session. Please refresh and try again.');
                        await loadTasksFromDB();
                        return;
                    }
                    throw error;
                }

                await loadTasksFromDB(); // Reload to rebuild hierarchy
            } catch (error: any) {
                console.error('Error updating task in DB:', error);
                const errorMessage = error.message || 'Failed to update task in database';
                showErrorToast('Failed to Update Task', errorMessage);
            }
        } else {
            // Update in localStorage
            const updateTaskInHierarchy = (tasks: Task[]): Task[] => {
                return tasks.map(task => {
                    if (task.id === id) {
                        return { ...task, ...updates };
                    }
                    if (task.children && task.children.length > 0) {
                        return { ...task, children: updateTaskInHierarchy(task.children) };
                    }
                    return task;
                });
            };
            setCurrentTasks(updateTaskInHierarchy(currentTasks));
        }
    };

    /**
     * Sync subtasks with database
     */
    const syncSubTasks = async (taskId: string, subTasks: SubTask[]) => {
        const userId = getUserId();
        if (!userId) return;

        try {
            // Get existing subtasks from DB
            const { data: existingSubTasks } = await supabase
                .from('subtasks')
                .select('*')
                .eq('task_id', taskId);

            const existingIds = new Set(existingSubTasks?.map(st => st.id) || []);
            const newIds = new Set(subTasks.map(st => st.id));

            // Delete removed subtasks
            const toDelete = existingSubTasks?.filter(st => !newIds.has(st.id)) || [];
            for (const st of toDelete) {
                await supabase.from('subtasks').delete().eq('id', st.id);
            }

            // Insert or update subtasks
            for (const st of subTasks) {
                if (existingIds.has(st.id)) {
                    // Update existing
                    await supabase
                        .from('subtasks')
                        .update({
                            title: st.title,
                            completed: st.completed,
                            completed_at: st.completedAt ? new Date(st.completedAt).toISOString() : null,
                            order: st.order || 0,
                        })
                        .eq('id', st.id);
                } else {
                    // Insert new
                    await supabase
                        .from('subtasks')
                        .insert({
                            id: st.id,
                            task_id: taskId,
                            title: st.title,
                            completed: st.completed,
                            completed_at: st.completedAt ? new Date(st.completedAt).toISOString() : null,
                            order: st.order || 0,
                            created_at: new Date(st.createdAt).toISOString(),
                        });
                }
            }
        } catch (error) {
            console.error('Error syncing subtasks:', error);
        }
    };

    /**
     * Delete task and all its children (cascade delete)
     */
    const deleteTask = async (id: string) => {
        const userId = getUserId();
        if (userId) {
            // Delete from database (cascade is handled by DB foreign key)
            try {
                const { error } = await supabase
                    .from('tasks')
                    .delete()
                    .eq('id', id)
                    .eq('user_id', userId);

                if (error) throw error;

                await loadTasksFromDB(); // Reload to rebuild hierarchy
            } catch (error: any) {
                console.error('Error deleting task from DB:', error);
                const errorMessage = error.message || 'Failed to delete task from database';
                showErrorToast('Failed to Delete Task', errorMessage);
                return;
            }
        } else {
            // Delete from localStorage (including children)
            const deleteTaskRecursive = (tasks: Task[]): Task[] => {
                return tasks
                    .filter(task => task.id !== id)
                    .map(task => ({
                        ...task,
                        children: task.children ? deleteTaskRecursive(task.children) : []
                    }));
            };
            setCurrentTasks(deleteTaskRecursive(currentTasks));
        }

        if (activeTaskId === id) {
            setActiveTaskId(null);
        }
    };

    const toggleTask = async (id: string) => {
        const task = flatTasks.find(t => t.id === id);
        if (!task) return;

        const newCompleted = !task.completed;
        const userId = getUserId();

        if (userId) {
            try {
                const { data, error } = await supabase
                    .from('tasks')
                    .update({
                        completed: newCompleted,
                        completed_at: newCompleted ? new Date().toISOString() : null
                    })
                    .eq('id', id)
                    .eq('user_id', userId)
                    .eq('version', task.version || 1)
                    .select('version')
                    .single();

                if (error) {
                    if (error.code === 'PGRST116') {
                        showErrorToast('Conflict Detected', 'Task was modified by another session. Please refresh and try again.');
                        await loadTasksFromDB();
                        return;
                    }
                    throw error;
                }

                await loadTasksFromDB();
            } catch (error: any) {
                console.error('Error toggling task in DB:', error);
                const errorMessage = error.message || 'Failed to update task status in database';
                showErrorToast('Failed to Update Task', errorMessage);
            }
        } else {
            const toggleTaskInHierarchy = (tasks: Task[]): Task[] => {
                return tasks.map(task => {
                    if (task.id === id) {
                        return {
                            ...task,
                            completed: newCompleted,
                            completedAt: newCompleted ? Date.now() : undefined
                        };
                    }
                    if (task.children && task.children.length > 0) {
                        return { ...task, children: toggleTaskInHierarchy(task.children) };
                    }
                    return task;
                });
            };
            setCurrentTasks(toggleTaskInHierarchy(currentTasks));
        }

        if (!newCompleted && activeTaskId === id) {
            setActiveTaskId(null);
        }
    };

    const incrementPomodoro = async (id: string) => {
        const task = flatTasks.find(t => t.id === id);
        if (!task) return;

        const newCount = task.pomodoroCount + 1;
        const userId = getUserId();

        if (userId) {
            try {
                const { data, error } = await supabase
                    .from('tasks')
                    .update({ pomodoro_count: newCount })
                    .eq('id', id)
                    .eq('user_id', userId)
                    .eq('version', task.version || 1)
                    .select('version')
                    .single();

                if (error) {
                    if (error.code === 'PGRST116') {
                        showErrorToast('Conflict Detected', 'Task was modified by another session. Please refresh and try again.');
                        await loadTasksFromDB();
                        return;
                    }
                    throw error;
                }

                await loadTasksFromDB();
            } catch (error: any) {
                console.error('Error incrementing pomodoro in DB:', error);
                const errorMessage = error.message || 'Failed to update pomodoro count in database';
                showErrorToast('Failed to Update Pomodoro', errorMessage);
            }
        } else {
            const updatePomodoroInHierarchy = (tasks: Task[]): Task[] => {
                return tasks.map(task => {
                    if (task.id === id) {
                        return { ...task, pomodoroCount: newCount };
                    }
                    if (task.children && task.children.length > 0) {
                        return { ...task, children: updatePomodoroInHierarchy(task.children) };
                    }
                    return task;
                });
            };
            setCurrentTasks(updatePomodoroInHierarchy(currentTasks));
        }
    };

    // SubTask management (existing implementation)
    const addSubTask = async (taskId: string, title: string) => {
        const newSubTask: SubTask = {
            id: `subtask-${Date.now()}`,
            title,
            completed: false,
            createdAt: Date.now(),
            order: 0,
        };

        const userId = getUserId();
        if (userId) {
            try {
                const { data, error } = await supabase
                    .from('subtasks')
                    .insert({
                        task_id: taskId,
                        title: newSubTask.title,
                        completed: newSubTask.completed,
                        created_at: new Date(newSubTask.createdAt).toISOString(),
                        order: newSubTask.order,
                    })
                    .select()
                    .single();

                if (error) throw error;

                newSubTask.id = data.id;
                await loadTasksFromDB();
            } catch (error: any) {
                console.error('Error adding subtask to DB:', error);
                const errorMessage = error.message || 'Failed to add subtask to database';
                showErrorToast('Failed to Add Subtask', errorMessage);
            }
        } else {
            const addSubTaskInHierarchy = (tasks: Task[]): Task[] => {
                return tasks.map(task => {
                    if (task.id === taskId) {
                        return { ...task, subTasks: [...(task.subTasks || []), newSubTask] };
                    }
                    if (task.children && task.children.length > 0) {
                        return { ...task, children: addSubTaskInHierarchy(task.children) };
                    }
                    return task;
                });
            };
            setCurrentTasks(addSubTaskInHierarchy(currentTasks));
        }
    };

    const toggleSubTask = async (taskId: string, subTaskId: string) => {
        const userId = getUserId();
        const task = flatTasks.find(t => t.id === taskId);
        const subTask = task?.subTasks?.find(st => st.id === subTaskId);
        if (!subTask) return;

        const newCompleted = !subTask.completed;

        if (userId) {
            try {
                const { error } = await supabase
                    .from('subtasks')
                    .update({
                        completed: newCompleted,
                        completed_at: newCompleted ? new Date().toISOString() : null
                    })
                    .eq('id', subTaskId);

                if (error) throw error;

                await loadTasksFromDB();
            } catch (error: any) {
                console.error('Error toggling subtask in DB:', error);
            }
        } else {
            const toggleSubTaskInHierarchy = (tasks: Task[]): Task[] => {
                return tasks.map(task => {
                    if (task.id === taskId) {
                        return {
                            ...task,
                            subTasks: (task.subTasks || []).map(st =>
                                st.id === subTaskId
                                    ? { ...st, completed: newCompleted, completedAt: newCompleted ? Date.now() : undefined }
                                    : st
                            )
                        };
                    }
                    if (task.children && task.children.length > 0) {
                        return { ...task, children: toggleSubTaskInHierarchy(task.children) };
                    }
                    return task;
                });
            };
            setCurrentTasks(toggleSubTaskInHierarchy(currentTasks));
        }
    };

    const deleteSubTask = async (taskId: string, subTaskId: string) => {
        const userId = getUserId();
        if (userId) {
            try {
                const { error } = await supabase
                    .from('subtasks')
                    .delete()
                    .eq('id', subTaskId);

                if (error) throw error;

                await loadTasksFromDB();
            } catch (error: any) {
                console.error('Error deleting subtask from DB:', error);
            }
        } else {
            const deleteSubTaskInHierarchy = (tasks: Task[]): Task[] => {
                return tasks.map(task => {
                    if (task.id === taskId) {
                        return { ...task, subTasks: (task.subTasks || []).filter(st => st.id !== subTaskId) };
                    }
                    if (task.children && task.children.length > 0) {
                        return { ...task, children: deleteSubTaskInHierarchy(task.children) };
                    }
                    return task;
                });
            };
            setCurrentTasks(deleteSubTaskInHierarchy(currentTasks));
        }
    };

    // Drag & Drop
    const reorderTasks = async (startIndex: number, endIndex: number) => {
        const flatSortedTasks = [...flatTasks].sort((a, b) => (a.order || 0) - (b.order || 0));
        const [removed] = flatSortedTasks.splice(startIndex, 1);
        flatSortedTasks.splice(endIndex, 0, removed);

        const reorderedTasks = flatSortedTasks.map((task, index) => ({
            ...task,
            order: index,
        }));

        const userId = getUserId();
        if (userId) {
            try {
                for (const task of reorderedTasks) {
                    await supabase
                        .from('tasks')
                        .update({ order: task.order })
                        .eq('id', task.id)
                        .eq('user_id', userId);
                }

                await loadTasksFromDB();
            } catch (error: any) {
                console.error('Error reordering tasks in DB:', error);
            }
        } else {
            setCurrentTasks(buildTaskHierarchy(reorderedTasks));
        }
    };

    const setActiveTask = (id: string | null) => {
        if (id) {
            const task = flatTasks.find(t => t.id === id);
            if (task && !task.completed) {
                setActiveTaskId(id);
            }
        } else {
            setActiveTaskId(null);
        }
    };

    const getActiveTask = () => {
        if (!activeTaskId) return null;
        return flatTasks.find(task => task.id === activeTaskId) || null;
    };

    const getActiveTasks = () => flatTasks.filter(task => !task.completed);
    const getCompletedTasks = () => flatTasks.filter(task => task.completed);

    const getTasksByPriority = (priority: Priority) => {
        return flatTasks.filter(task => task.priority === priority && !task.completed);
    };

    const getTasksByTag = (tagId: string) => {
        return flatTasks.filter(task => task.tags?.includes(tagId) && !task.completed);
    };

    const getOverdueTasks = () => {
        const now = Date.now();
        return flatTasks.filter(task => task.dueDate && task.dueDate < now && !task.completed);
    };

    const getTasksDueToday = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return flatTasks.filter(task =>
            task.dueDate &&
            task.dueDate >= today.getTime() &&
            task.dueDate < tomorrow.getTime() &&
            !task.completed
        );
    };

    const getRootTasks = () => currentTasks;
    const getChildTasks = (parentId: string) => {
        const parent = flatTasks.find(t => t.id === parentId);
        return parent?.children || [];
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
        flatTasks,
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
        getRootTasks,
        getChildTasks,
        sortTasksByPriority,
        sortTasksByOrder,
        loadTasksFromDB,
    };
}
