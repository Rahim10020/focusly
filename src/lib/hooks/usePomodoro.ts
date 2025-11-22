/**
 * @fileoverview Pomodoro timer state management hook.
 * Provides complete timer functionality including work sessions, breaks,
 * automatic session transitions, and cycle tracking for the Pomodoro technique.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { TimerStatus, PomodoroSession } from '@/types';
import { TimerSettings } from './useSettings';

/**
 * Configuration options for the usePomodoro hook.
 * @interface UsePomodoroOptions
 */
interface UsePomodoroOptions {
    /** Timer duration and behavior settings */
    settings: TimerSettings;
    /** Callback fired when any session (work or break) completes */
    onSessionComplete?: (session: PomodoroSession) => void;
    /** Callback fired specifically when a work session completes */
    onWorkComplete?: () => void;
    /** Callback fired specifically when a break session completes */
    onBreakComplete?: () => void;
    /** ID of the currently active task being worked on */
    activeTaskId?: string | null;
}

/**
 * Hook for managing Pomodoro timer state and controls.
 * Handles work sessions, short/long breaks, automatic transitions,
 * and tracks completed cycles.
 *
 * @param {UsePomodoroOptions} options - Configuration options for the timer
 * @returns {Object} Timer state and control functions
 * @returns {number} returns.timeLeft - Remaining time in seconds
 * @returns {TimerStatus} returns.status - Current timer status ('idle' | 'running' | 'paused')
 * @returns {'work' | 'break'} returns.sessionType - Type of current session
 * @returns {number} returns.completedCycles - Number of completed work/break cycles
 * @returns {Function} returns.start - Start or resume the timer
 * @returns {Function} returns.pause - Pause the timer
 * @returns {Function} returns.reset - Reset timer to initial state
 * @returns {Function} returns.skip - Skip the current session
 *
 * @example
 * const {
 *   timeLeft,
 *   status,
 *   sessionType,
 *   start,
 *   pause,
 *   reset
 * } = usePomodoro({
 *   settings: timerSettings,
 *   onWorkComplete: () => console.log('Work session done!'),
 *   activeTaskId: 'task-123'
 * });
 */
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

    // Auto-start breaks and pomodoros
    useEffect(() => {
        if (status === 'idle' && sessionType === 'break' && settings.autoStartBreaks) {
            const timeoutId = setTimeout(() => setStatus('running'), 1000);
            return () => clearTimeout(timeoutId);
        }
        if (status === 'idle' && sessionType === 'work' && settings.autoStartPomodoros && completedCycles > 0) {
            const timeoutId = setTimeout(() => setStatus('running'), 1000);
            return () => clearTimeout(timeoutId);
        }
    }, [status, sessionType, settings.autoStartBreaks, settings.autoStartPomodoros, completedCycles]);

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
        } else {
            setSessionType('work');
            setTimeLeft(settings.workDuration);
            setInitialTimeLeft(settings.workDuration);
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