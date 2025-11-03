import { useState, useEffect, useRef, useCallback } from 'react';
import { TimerStatus, PomodoroSession } from '@/types';
import { TimerSettings } from './useSettings';

interface UsePomodoroOptions {
    settings: TimerSettings;
    onSessionComplete?: (session: PomodoroSession) => void;
    onWorkComplete?: () => void;
    onBreakComplete?: () => void;
    activeTaskId?: string | null;
}

export function usePomodoro(options: UsePomodoroOptions) {
    const { settings, onSessionComplete, onWorkComplete, onBreakComplete, activeTaskId } = options;

    const [timeLeft, setTimeLeft] = useState(settings.workDuration);
    const [status, setStatus] = useState<TimerStatus>('idle');
    const [sessionType, setSessionType] = useState<'work' | 'break'>('work');
    const [completedCycles, setCompletedCycles] = useState(0);
    const [currentSessionStart, setCurrentSessionStart] = useState<number | null>(null);
    const [initialTimeLeft, setInitialTimeLeft] = useState(settings.workDuration);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Update timeLeft when settings change and timer is idle
    useEffect(() => {
        if (status === 'idle') {
            if (sessionType === 'work') {
                setTimeLeft(settings.workDuration);
                setInitialTimeLeft(settings.workDuration);
            } else {
                const isLongBreak = completedCycles % settings.cyclesBeforeLongBreak === 0;
                const breakDuration = isLongBreak ? settings.longBreakDuration : settings.shortBreakDuration;
                setTimeLeft(breakDuration);
                setInitialTimeLeft(breakDuration);
            }
        }
    }, [settings, status, sessionType, completedCycles]);

    useEffect(() => {
        if (status === 'running' && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            handleSessionComplete();
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [status, timeLeft]);

    useEffect(() => {
        if (status === 'running' && !currentSessionStart) {
            setCurrentSessionStart(Date.now());
        }
    }, [status, currentSessionStart]);

    const handleSessionComplete = useCallback(() => {
        const completed = timeLeft === 0;
        const session: PomodoroSession = {
            id: `session-${Date.now()}`,
            type: sessionType,
            duration: initialTimeLeft,
            completed,
            startedAt: currentSessionStart || Date.now(),
            completedAt: completed ? Date.now() : undefined,
            taskId: activeTaskId || undefined,
        };

        onSessionComplete?.(session);

        // Call specific callbacks
        if (sessionType === 'work') {
            onWorkComplete?.();
        } else {
            onBreakComplete?.();
        }

        setStatus('idle');
        setCurrentSessionStart(null);

        if (sessionType === 'work') {
            const newCompletedCycles = completedCycles + 1;
            setCompletedCycles(newCompletedCycles);

            const isLongBreak = newCompletedCycles % settings.cyclesBeforeLongBreak === 0;
            setSessionType('break');
            const breakDuration = isLongBreak ? settings.longBreakDuration : settings.shortBreakDuration;
            setTimeLeft(breakDuration);
            setInitialTimeLeft(breakDuration);

            // Auto-start breaks if enabled
            if (settings.autoStartBreaks) {
                setTimeout(() => setStatus('running'), 1000);
            }
        } else {
            setSessionType('work');
            setTimeLeft(settings.workDuration);
            setInitialTimeLeft(settings.workDuration);

            // Auto-start pomodoros if enabled
            if (settings.autoStartPomodoros) {
                setTimeout(() => setStatus('running'), 1000);
            }
        }
    }, [timeLeft, sessionType, initialTimeLeft, currentSessionStart, activeTaskId, onSessionComplete, onWorkComplete, onBreakComplete, settings, completedCycles]);

    const start = useCallback(() => {
        setStatus('running');
    }, []);

    const pause = useCallback(() => {
        setStatus('paused');
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
    }, []);

    const reset = useCallback(() => {
        setStatus('idle');
        setSessionType('work');
        setTimeLeft(settings.workDuration);
        setInitialTimeLeft(settings.workDuration);
        setCurrentSessionStart(null);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
    }, [settings.workDuration]);

    const skip = useCallback(() => {
        setTimeLeft(0);
    }, []);

    return {
        timeLeft,
        status,
        sessionType,
        completedCycles,
        start,
        pause,
        reset,
        skip,
    };
}