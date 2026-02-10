/**
 * @fileoverview Task management hook.
 * Composes all task-related hooks for a complete task management solution.
 */

import { useTaskStorage } from './useTaskStorage';
import { useTaskActions } from './useTaskActions';
import { useSubTaskActions } from './useSubTaskActions';
import { useTaskFilters } from './useTaskFilters';
import { useTaskReorder } from './useTaskReorder';
import { useActiveTask } from './useActiveTask';
import { STORAGE_KEYS } from '@/lib/constants';
import { Task, Priority } from '@/types';
import { CreateTaskInput } from '@/types/task-input';

interface UseTasksReturn {
    // Tasks state
    tasks: Task[];
    activeTaskId: string | null;
    loading: boolean;
    error: string | null;

    // Task actions
    addTask: (input: CreateTaskInput) => Promise<void>;
    updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    toggleTask: (id: string) => Promise<void>;
    incrementPomodoro: (id: string) => Promise<void>;

    // SubTask actions
    addSubTask: (taskId: string, title: string) => Promise<void>;
    toggleSubTask: (taskId: string, subTaskId: string) => Promise<void>;
    deleteSubTask: (taskId: string, subTaskId: string) => Promise<void>;

    // Filters
    getActiveTasks: () => Task[];
    getCompletedTasks: () => Task[];
    getTasksByPriority: (priority: Priority) => Task[];
    getTasksByTag: (tagId: string) => Task[];
    getOverdueTasks: () => Task[];
    getTasksDueToday: () => Task[];
    sortTasksByPriority: (tasksToSort: Task[]) => Task[];
    sortTasksByOrder: (tasksToSort: Task[]) => Task[];

    // Reorder
    reorderTasks: (startIndex: number, endIndex: number) => Promise<void>;

    // Active task
    setActiveTask: (id: string | null) => void;
    getActiveTask: () => Task | null;
}

export function useTasks(): UseTasksReturn {
    const storage = useTaskStorage(STORAGE_KEYS.TASKS);

    const taskActions = useTaskActions({
        tasks: storage.tasks,
        setTasks: (fn) => storage.setTasks(fn as Task[]),
    });

    const subtaskActions = useSubTaskActions({
        tasks: storage.tasks,
        setTasks: (fn) => storage.setTasks(fn as Task[]),
    });

    const filters = useTaskFilters({
        tasks: storage.tasks,
    });

    const reorder = useTaskReorder({
        tasks: storage.tasks,
        setTasks: (fn) => storage.setTasks(fn as Task[]),
    });

    const activeTask = useActiveTask({
        tasks: storage.tasks,
    });

    return {
        // Storage
        tasks: storage.tasks,
        loading: storage.loading,
        error: storage.error,
        activeTaskId: activeTask.activeTaskId,

        // Actions
        addTask: taskActions.addTask,
        updateTask: taskActions.updateTask,
        deleteTask: taskActions.deleteTask,
        toggleTask: taskActions.toggleTask,
        incrementPomodoro: taskActions.incrementPomodoro,

        // SubTask Actions
        addSubTask: subtaskActions.addSubTask,
        toggleSubTask: subtaskActions.toggleSubTask,
        deleteSubTask: subtaskActions.deleteSubTask,

        // Filters
        getActiveTasks: filters.getActiveTasks,
        getCompletedTasks: filters.getCompletedTasks,
        getTasksByPriority: filters.getTasksByPriority,
        getTasksByTag: filters.getTasksByTag,
        getOverdueTasks: filters.getOverdueTasks,
        getTasksDueToday: filters.getTasksDueToday,
        sortTasksByPriority: filters.sortTasksByPriority,
        sortTasksByOrder: filters.sortTasksByOrder,

        // Reorder
        reorderTasks: reorder.reorderTasks,

        // Active Task
        setActiveTask: activeTask.setActiveTask,
        getActiveTask: activeTask.getActiveTask,
    };
}
