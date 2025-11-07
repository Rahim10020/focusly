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

interface PomodoroTimerProps {
    activeTaskId: string | null;
    tasks: Task[];
    onSelectTask: (taskId: string | null) => void;
    onSessionComplete: (session: any) => void;
    onPomodoroComplete: (taskId: string) => void;
    onTimerRefReady: (ref: { start: () => void; pause: () => void; reset: () => void; skip: () => void; status: 'idle' | 'running' | 'paused'; }) => void;
}

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
                <ProgressRing progress={progress} size={240} strokeWidth={10} />
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