import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useLocalStorage } from './useLocalStorage';
import { Task, SubTask, Priority, SubDomain } from '@/types';
import { STORAGE_KEYS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';

export function useTasks() {
    const { data: session } = useSession();
    const [tasks, setTasks] = useLocalStorage<Task[]>(STORAGE_KEYS.TASKS, []);
    const [activeTaskId, setActiveTaskId] = useLocalStorage<string | null>('focusly_active_task', null);
    const [dbTasks, setDbTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);

    const getUserId = () => (session?.user as any)?.id;

    // Load tasks from database when user logs in
    useEffect(() => {
        if (getUserId()) {
            loadTasksFromDB();
        } else {
            setDbTasks([]);
        }
    }, [getUserId()]);

    const loadTasksFromDB = async () => {
        const userId = getUserId();
        if (!userId) return;

        setLoading(true);
        try {
            const { data: tasksData, error: tasksError } = await supabase
                .from('tasks')
                .select(`
                    *,
                    subtasks (*)
                `)
                .eq('user_id', userId)
                .order('order', { ascending: true });

            if (tasksError) throw tasksError;

            const formattedTasks: Task[] = tasksData.map(dbTask => ({
                id: dbTask.id,
                title: dbTask.title,
                completed: dbTask.completed,
                createdAt: new Date(dbTask.created_at).getTime(),
                completedAt: dbTask.completed_at ? new Date(dbTask.completed_at).getTime() : undefined,
                pomodoroCount: dbTask.pomodoro_count,
                priority: dbTask.priority as Priority,
                tags: dbTask.tags || [],
                dueDate: dbTask.due_date ? new Date(dbTask.due_date).getTime() : undefined,
                notes: dbTask.notes,
                subTasks: dbTask.subtasks?.map((st: any) => ({
                    id: st.id,
                    title: st.title,
                    completed: st.completed,
                    createdAt: new Date(st.created_at).getTime(),
                    completedAt: st.completed_at ? new Date(st.completed_at).getTime() : undefined,
                })) || [],
                order: dbTask.order,
                subDomain: dbTask.sub_domain as SubDomain,
            }));

            setDbTasks(formattedTasks);
        } catch (error: any) {
            console.error('Error loading tasks from DB:', error);
        } finally {
            setLoading(false);
        }
    };

    const currentTasks = getUserId() ? dbTasks : tasks;
    const setCurrentTasks = getUserId() ? setDbTasks : setTasks;

    const addTask = async (
        title: string,
        priority?: Priority,
        tags?: string[],
        dueDate?: number,
        notes?: string,
        subDomain?: SubDomain
    ) => {
        const maxOrder = currentTasks.length > 0 ? Math.max(...currentTasks.map(t => t.order || 0)) : 0;
        const newTask: Task = {
            id: Date.now().toString(),
            title,
            completed: false,
            createdAt: Date.now(),
            pomodoroCount: 0,
            priority,
            tags: tags || [],
            dueDate,
            notes,
            subTasks: [],
            order: maxOrder + 1,
            subDomain,
        };

        const userId = getUserId();
        if (userId) {
            // Save to database
            try {
                const { data, error } = await supabase
                    .from('tasks')
                    .insert({
                        user_id: userId,
                        title: newTask.title,
                        completed: newTask.completed,
                        created_at: new Date(newTask.createdAt).toISOString(),
                        pomodoro_count: newTask.pomodoroCount,
                        priority: newTask.priority,
                        tags: newTask.tags,
                        due_date: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : null,
                        notes: newTask.notes,
                        order: newTask.order,
                        sub_domain: newTask.subDomain,
                    })
                    .select()
                    .single();

                if (error) throw error;

                newTask.id = data.id;
                setCurrentTasks([...currentTasks, newTask]);
            } catch (error: any) {
                console.error('Error adding task to DB:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code,
                    task: newTask
                });
            }
        } else {
            // Save to localStorage
            setCurrentTasks([...currentTasks, newTask]);
        }
    };

    const updateTask = async (id: string, updates: Partial<Task>) => {
        const userId = getUserId();
        if (userId) {
            // Update in database
            try {
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
                if (updates.notes !== undefined) updateData.notes = updates.notes;
                if (updates.order !== undefined) updateData.order = updates.order;
                if (updates.subDomain !== undefined) updateData.sub_domain = updates.subDomain;

                const { error } = await supabase
                    .from('tasks')
                    .update(updateData)
                    .eq('id', id)
                    .eq('user_id', userId);

                if (error) throw error;

                setCurrentTasks(currentTasks.map(task =>
                    task.id === id ? { ...task, ...updates } : task
                ));
            } catch (error: any) {
                console.error('Error updating task in DB:', error);
            }
        } else {
            // Update in localStorage
            setCurrentTasks(currentTasks.map(task =>
                task.id === id ? { ...task, ...updates } : task
            ));
        }
    };

    const deleteTask = async (id: string) => {
        const userId = getUserId();
        if (userId) {
            // Delete from database
            try {
                const { error } = await supabase
                    .from('tasks')
                    .delete()
                    .eq('id', id)
                    .eq('user_id', userId);

                if (error) throw error;

                setCurrentTasks(currentTasks.filter(task => task.id !== id));
            } catch (error: any) {
                console.error('Error deleting task from DB:', error);
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
            // Update in database
            try {
                const { error } = await supabase
                    .from('tasks')
                    .update({
                        completed: newCompleted,
                        completed_at: newCompleted ? new Date().toISOString() : null
                    })
                    .eq('id', id)
                    .eq('user_id', userId);

                if (error) throw error;

                setCurrentTasks(currentTasks.map(t =>
                    t.id === id
                        ? {
                            ...t,
                            completed: newCompleted,
                            completedAt: newCompleted ? Date.now() : undefined
                        }
                        : t
                ));
            } catch (error: any) {
                console.error('Error toggling task in DB:', error);
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
            // Update in database
            try {
                const { error } = await supabase
                    .from('tasks')
                    .update({ pomodoro_count: newCount })
                    .eq('id', id)
                    .eq('user_id', userId);

                if (error) throw error;

                setCurrentTasks(currentTasks.map(t =>
                    t.id === id
                        ? { ...t, pomodoroCount: newCount }
                        : t
                ));
            } catch (error: any) {
                console.error('Error incrementing pomodoro in DB:', error);
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
                const { data, error } = await supabase
                    .from('subtasks')
                    .insert({
                        task_id: taskId,
                        title: newSubTask.title,
                        completed: newSubTask.completed,
                        created_at: new Date(newSubTask.createdAt).toISOString(),
                    })
                    .select()
                    .single();

                if (error) throw error;

                newSubTask.id = data.id;
                setCurrentTasks(currentTasks.map(task =>
                    task.id === taskId
                        ? { ...task, subTasks: [...(task.subTasks || []), newSubTask] }
                        : task
                ));
            } catch (error: any) {
                console.error('Error adding subtask to DB:', error);
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
                const { error } = await supabase
                    .from('subtasks')
                    .update({
                        completed: newCompleted,
                        completed_at: newCompleted ? new Date().toISOString() : null
                    })
                    .eq('id', subTaskId);

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
                const { error } = await supabase
                    .from('subtasks')
                    .delete()
                    .eq('id', subTaskId);

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

                // Update each task's order
                for (const update of updates) {
                    await supabase
                        .from('tasks')
                        .update({ order: update.order })
                        .eq('id', update.id)
                        .eq('user_id', userId);
                }

                setCurrentTasks(reorderedTasks);
            } catch (error: any) {
                console.error('Error reordering tasks in DB:', error);
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