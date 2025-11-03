export interface Task {
    id: string;
    title: string;
    completed: boolean;
    createdAt: number;
    completedAt?: number;
    pomodoroCount: number;
}

export interface PomodoroSession {
    id: string;
    type: 'work' | 'break';
    duration: number;
    completed: boolean;
    taskId?: string;
    startedAt: number;
    completedAt?: number;
}

export interface Stats {
    totalFocusTime: number;
    totalTasks: number;
    completedTasks: number;
    totalSessions: number;
    streak: number;
}

export type TimerStatus = 'idle' | 'running' | 'paused';

export type Theme = 'light' | 'dark';