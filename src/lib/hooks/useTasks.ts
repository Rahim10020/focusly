import { useLocalStorage } from './useLocalStorage';
import { Task } from '@/types';
import { STORAGE_KEYS } from '@/lib/constants';

export function useTasks() {
    const [tasks, setTasks] = useLocalStorage<Task[]>(STORAGE_KEYS.TASKS, []);

    const addTask = (title: string) => {
        const newTask: Task = {
            id: Date.now().toString(),
            title,
            completed: false,
            createdAt: Date.now(),
            pomodoroCount: 0,
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
    };

    const incrementPomodoro = (id: string) => {
        setTasks(tasks.map(task =>
            task.id === id
                ? { ...task, pomodoroCount: task.pomodoroCount + 1 }
                : task
        ));
    };

    const getActiveTasks = () => tasks.filter(task => !task.completed);
    const getCompletedTasks = () => tasks.filter(task => task.completed);

    return {
        tasks,
        addTask,
        updateTask,
        deleteTask,
        toggleTask,
        incrementPomodoro,
        getActiveTasks,
        getCompletedTasks,
    };
}