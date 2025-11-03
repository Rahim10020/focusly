export interface Task {
    id: string;
    title: string;
    completed: boolean;
    createdAt: number;
    completedAt?: number;
    pomodoroCount: number;
    priority?: 'low' | 'medium' | 'high';
    tags?: string[];
    dueDate?: number;
    notes?: string;
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
    longestStreak?: number;
    tasksCompletedToday?: number;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    unlockedAt?: number;
    progress?: number;
    target?: number;
}

export interface Tag {
    id: string;
    name: string;
    color: string;
    createdAt: number;
}

export type TimerStatus = 'idle' | 'running' | 'paused';

export type Theme = 'light' | 'dark';

export type Priority = 'low' | 'medium' | 'high';