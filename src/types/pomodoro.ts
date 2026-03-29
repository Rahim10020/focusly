export type TimerStatus = 'idle' | 'running' | 'paused';

export interface PomodoroSession {
    id: string;
    type: 'work' | 'break';
    duration: number;
    completed: boolean;
    taskId?: string;
    startedAt: number;
    completedAt?: number;
}
