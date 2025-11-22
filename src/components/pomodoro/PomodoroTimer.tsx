/**
 * @fileoverview Main Pomodoro timer orchestrator component that coordinates all timer functionality.
 * Manages timer state, sound effects, notifications, and integrates with task management.
 */

'use client';

import { useEffect } from 'react';
import { usePomodoro } from '@/lib/hooks/usePomodoro';
import { useSettings } from '@/lib/hooks/useSettings';
import { useSound } from '@/lib/hooks/useSound';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { getProgress } from '@/lib/utils/time';
import TimerDisplay from './TimerDisplay';
import TimerControls from './TimerControls';
import ProgressRing from './ProgressRing';
import SessionIndicator from './SessionIndicator';
import TaskSelector from '../tasks/TaskSelector';
import { Task } from '@/types';

/**
 * Props for the PomodoroTimer component.
 * @interface PomodoroTimerProps
 * @property {string | null} activeTaskId - ID of the currently selected task, or null if none
 * @property {Task[]} tasks - Array of available tasks to select from
 * @property {function} onSelectTask - Callback when a task is selected or deselected
 * @property {function} onSessionComplete - Callback when a work or break session completes
 * @property {function} onPomodoroComplete - Callback when a pomodoro is completed for a task
 * @property {function} onTimerRefReady - Callback to expose timer controls to parent component
 */
interface PomodoroTimerProps {
    activeTaskId: string | null;
    tasks: Task[];
    onSelectTask: (taskId: string | null) => void;
    onSessionComplete: (session: any) => void;
    onPomodoroComplete: (taskId: string) => void;
    onTimerRefReady: (ref: { start: () => void; pause: () => void; reset: () => void; skip: () => void; status: 'idle' | 'running' | 'paused'; }) => void;
}

/**
 * Main Pomodoro timer component that orchestrates the complete timer experience.
 * Combines timer display, controls, progress visualization, and task selection.
 * Handles sound effects, browser notifications, and session tracking.
 *
 * @param {PomodoroTimerProps} props - Component props
 * @returns {JSX.Element} The rendered Pomodoro timer interface
 *
 * @example
 * <PomodoroTimer
 *   activeTaskId={selectedTaskId}
 *   tasks={taskList}
 *   onSelectTask={(id) => setSelectedTaskId(id)}
 *   onSessionComplete={(session) => saveSession(session)}
 *   onPomodoroComplete={(taskId) => incrementTaskPomodoro(taskId)}
 *   onTimerRefReady={(ref) => setTimerRef(ref)}
 * />
 */
export default function PomodoroTimer({
    activeTaskId,
    tasks,
    onSelectTask,
    onSessionComplete,
    onPomodoroComplete,
    onTimerRefReady,
}: PomodoroTimerProps) {
    const { settings } = useSettings();
    const { playWorkStart, playWorkPause, playWorkComplete, playBreakComplete } = useSound();
    const { showNotification, permission, requestPermission } = useNotifications();

    const {
        timeLeft,
        status,
        sessionType,
        completedCycles,
        start,
        pause,
        reset,
        skip,
    } = usePomodoro({
        settings,
        activeTaskId,
        onSessionComplete,
        onWorkComplete: () => {
            playWorkComplete();
            showNotification('Work session completed! 🎉', {
                body: 'Time for a break. Great job!',
            });

            // Incrémenter le pomodoro de la tâche active
            if (activeTaskId) {
                onPomodoroComplete(activeTaskId);
            }
        },
        onBreakComplete: () => {
            playBreakComplete();
            showNotification('Break time over! ⏰', {
                body: 'Ready to focus again?',
            });
        },
    });

    // Expose timer controls to parent via ref
    useEffect(() => {
        onTimerRefReady({
            start,
            pause,
            reset,
            skip,
            status,
        });
    }, [start, pause, reset, skip, status, onTimerRefReady]);

    const getTotalTime = () => {
        if (sessionType === 'work') return settings.workDuration;
        const isLongBreak = completedCycles % settings.cyclesBeforeLongBreak === 0;
        return isLongBreak ? settings.longBreakDuration : settings.shortBreakDuration;
    };

    const progress = getProgress(timeLeft, getTotalTime());

    const handleStart = () => {
        // Demander la permission pour les notifications au premier démarrage
        if (permission === 'default') {
            requestPermission();
        }
        playWorkStart();
        start();
    };

    const activeTask = tasks.find(t => t.id === activeTaskId);

    return (
        <div className="flex flex-col items-center space-y-8">
            <div className="relative flex items-center justify-center">
                <ProgressRing
                    progress={progress}
                    size={260}
                    strokeWidth={12}
                    isActive={status === 'running'}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <TimerDisplay timeLeft={timeLeft} sessionType={sessionType} />
                </div>
            </div>

            <SessionIndicator
                completedCycles={completedCycles}
                cyclesBeforeLongBreak={settings.cyclesBeforeLongBreak}
            />

            {activeTask && status !== 'idle' && (
                <div className="text-center px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                    <span className="text-sm text-primary font-medium">
                        🍅 {activeTask.title}
                    </span>
                </div>
            )}

            <TimerControls
                status={status}
                onStart={handleStart}
                onPause={() => {
                    playWorkPause();
                    pause();
                }}
                onReset={reset}
                onSkip={skip}
            />

            {status === 'idle' && sessionType === 'work' && (
                <div className="w-full max-w-md">
                    <TaskSelector
                        tasks={tasks}
                        activeTaskId={activeTaskId}
                        onSelectTask={onSelectTask}
                    />
                </div>
            )}
        </div>
    );
}