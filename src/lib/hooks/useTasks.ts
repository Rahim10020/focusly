import { useLocalStorage } from './useLocalStorage';
import { Task, SubTask, Priority } from '@/types';
import { STORAGE_KEYS } from '@/lib/constants';

export function useTasks() {
    const [tasks, setTasks] = useLocalStorage<Task[]>(STORAGE_KEYS.TASKS, []);
    const [activeTaskId, setActiveTaskId] = useLocalStorage<string | null>('focusly_active_task', null);

    const addTask = (
        title: string,
        priority?: Priority,
        tags?: string[],
        dueDate?: number,
        notes?: string
    ) => {
        const maxOrder = tasks.length > 0 ? Math.max(...tasks.map(t => t.order || 0)) : 0;
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

    // SubTask management
    const addSubTask = (taskId: string, title: string) => {
        const newSubTask: SubTask = {
            id: `subtask-${Date.now()}`,
            title,
            completed: false,
            createdAt: Date.now(),
        };

        setTasks(tasks.map(task =>
            task.id === taskId
                ? { ...task, subTasks: [...(task.subTasks || []), newSubTask] }
                : task
        ));
    };

    const toggleSubTask = (taskId: string, subTaskId: string) => {
        setTasks(tasks.map(task =>
            task.id === taskId
                ? {
                    ...task,
                    subTasks: (task.subTasks || []).map(st =>
                        st.id === subTaskId
                            ? { ...st, completed: !st.completed, completedAt: !st.completed ? Date.now() : undefined }
                            : st
                    )
                }
                : task
        ));
    };

    const deleteSubTask = (taskId: string, subTaskId: string) => {
        setTasks(tasks.map(task =>
            task.id === taskId
                ? { ...task, subTasks: (task.subTasks || []).filter(st => st.id !== subTaskId) }
                : task
        ));
    };

    // Drag & Drop
    const reorderTasks = (startIndex: number, endIndex: number) => {
        const sortedTasks = [...tasks].sort((a, b) => (a.order || 0) - (b.order || 0));
        const [removed] = sortedTasks.splice(startIndex, 1);
        sortedTasks.splice(endIndex, 0, removed);

        // Reassign order
        const reorderedTasks = sortedTasks.map((task, index) => ({
            ...task,
            order: index,
        }));

        setTasks(reorderedTasks);
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

    const getOverdueTasks = () => {
        const now = Date.now();
        return tasks.filter(task => task.dueDate && task.dueDate < now && !task.completed);
    };

    const getTasksDueToday = () => {
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
        tasks,
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