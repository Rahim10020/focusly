import { useState, useEffect, useRef } from 'react';
import { TimerStatus, PomodoroSession } from '@/types';
import { POMODORO_DURATION, SHORT_BREAK, LONG_BREAK, POMODORO_CYCLES_FOR_LONG_BREAK } from '@/lib/constants';

export function usePomodoro(options?: { onSessionComplete?: (session: PomodoroSession) => void }) {
    const [timeLeft, setTimeLeft] = useState(POMODORO_DURATION);
    const [status, setStatus] = useState<TimerStatus>('idle');
    const [sessionType, setSessionType] = useState<'work' | 'break'>('work');
    const [completedCycles, setCompletedCycles] = useState(0);
    const [currentSessionStart, setCurrentSessionStart] = useState<number | null>(null);
    const [initialTimeLeft, setInitialTimeLeft] = useState(POMODORO_DURATION);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

    const handleSessionComplete = () => {
        const completed = timeLeft === 0;
        const session: PomodoroSession = {
            id: `session-${Date.now()}`,
            type: sessionType,
            duration: initialTimeLeft,
            completed,
            startedAt: currentSessionStart || Date.now(),
            completedAt: completed ? Date.now() : undefined,
        };

        options?.onSessionComplete?.(session);

        setStatus('idle');
        setCurrentSessionStart(null);

        if (sessionType === 'work') {
            const newCompletedCycles = completedCycles + 1;
            setCompletedCycles(newCompletedCycles);

            const isLongBreak = newCompletedCycles % POMODORO_CYCLES_FOR_LONG_BREAK === 0;
            setSessionType('break');
            setTimeLeft(isLongBreak ? LONG_BREAK : SHORT_BREAK);
            setInitialTimeLeft(isLongBreak ? LONG_BREAK : SHORT_BREAK);
        } else {
            setSessionType('work');
            setTimeLeft(POMODORO_DURATION);
            setInitialTimeLeft(POMODORO_DURATION);
        }
    };

    const start = () => {
        setStatus('running');
    };

    const pause = () => {
        setStatus('paused');
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
    };

    const reset = () => {
        setStatus('idle');
        setSessionType('work');
        setTimeLeft(POMODORO_DURATION);
        setInitialTimeLeft(POMODORO_DURATION);
        setCurrentSessionStart(null);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
    };

    const skip = () => {
        setTimeLeft(0);
        handleSessionComplete();
    };

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