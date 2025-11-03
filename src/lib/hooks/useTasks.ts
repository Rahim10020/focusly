import { useLocalStorage } from './useLocalStorage';
import { Task, Priority } from '@/types';
import { STORAGE_KEYS } from '@/lib/constants';

export function useTasks() {
    const [tasks, setTasks] = useLocalStorage<Task[]>(STORAGE_KEYS.TASKS, []);
    const [activeTaskId, setActiveTaskId] = useLocalStorage<string | null>('focusly_active_task', null);

    const addTask = (title: string, priority?: Priority, tags?: string[]) => {
        const newTask: Task = {
            id: Date.now().toString(),
            title,
            completed: false,
            createdAt: Date.now(),
            pomodoroCount: 0,
            priority,
            tags: tags || [],
        };
        setTasks([...tasks, newTask]);
    };

    const updateTask = (id: string, updates: Partial<Task>) => {
        setTasks(tasks.map(task =>
            task.id === id ? { ...task, ...updates } : task
        ));
    };

    const deleteTask = (id: string) => {
        setTasks(tasks.filter(task => task.id !== id));
        if (activeTaskId === id) {
            setActiveTaskId(null);
        }
    };

    const toggleTask = (id: string) => {
        setTasks(tasks.map(task =>
            task.id === id
                ? {
                    ...task,
                    completed: !task.completed,
                    completedAt: !task.completed ? Date.now() : undefined
                }
                : task
        ));
        const task = tasks.find(t => t.id === id);
        if (task && !task.completed && activeTaskId === id) {
            setActiveTaskId(null);
        }
    };

    const incrementPomodoro = (id: string) => {
        setTasks(tasks.map(task =>
            task.id === id
                ? { ...task, pomodoroCount: task.pomodoroCount + 1 }
                : task
        ));
    };

    const setActiveTask = (id: string | null) => {
        if (id) {
            const task = tasks.find(t => t.id === id);
            if (task && !task.completed) {
                setActiveTaskId(id);
            }
        } else {
            setActiveTaskId(null);
        }
    };

    const getActiveTask = () => {
        if (!activeTaskId) return null;
        return tasks.find(task => task.id === activeTaskId) || null;
    };

    const getActiveTasks = () => tasks.filter(task => !task.completed);
    const getCompletedTasks = () => tasks.filter(task => task.completed);

    const getTasksByPriority = (priority: Priority) => {
        return tasks.filter(task => task.priority === priority && !task.completed);
    };

    const getTasksByTag = (tagId: string) => {
        return tasks.filter(task => task.tags?.includes(tagId) && !task.completed);
    };

    const sortTasksByPriority = (tasksToSort: Task[]) => {
        const priorityOrder = { high: 0, medium: 1, low: 2, undefined: 3 };
        return [...tasksToSort].sort((a, b) => {
            const aPriority = a.priority || 'undefined';
            const bPriority = b.priority || 'undefined';
            return priorityOrder[aPriority] - priorityOrder[bPriority];
        });
    };

    return {
        tasks,
        activeTaskId,
        addTask,
        updateTask,
        deleteTask,
        toggleTask,
        incrementPomodoro,
        setActiveTask,
        getActiveTask,
        getActiveTasks,
        getCompletedTasks,
        getTasksByPriority,
        getTasksByTag,
        sortTasksByPriority,
    };
}