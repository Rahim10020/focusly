/**
 * @fileoverview Pomodoro timer state management hook.
 * Provides complete timer functionality including work sessions, breaks,
 * automatic session transitions, and cycle tracking for the Pomodoro technique.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { TimerStatus, PomodoroSession } from '@/types';
import { TimerSettings } from './useSettings';
import { logger } from '@/lib/logger';

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
 * Persisted state for the Pomodoro timer
 * Saved to localStorage to restore state after page refresh
 */
interface PersistedTimerState {
    timeLeft: number;
    status: TimerStatus;
    sessionType: 'work' | 'break';
    completedCycles: number;
    currentSessionStart: number | null;
    initialTimeLeft: number;
    savedAt: number;
}

const STORAGE_KEY = 'focusly_pomodoro_state';

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

    // Load initial state from localStorage
    const loadPersistedState = (): Partial<PersistedTimerState> | null => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return null;

            const state: PersistedTimerState = JSON.parse(stored);

            // Check if state is stale (older than 24 hours)
            const age = Date.now() - state.savedAt;
            if (age > 24 * 60 * 60 * 1000) {
                logger.info('Pomodoro state is stale, clearing', { age });
                localStorage.removeItem(STORAGE_KEY);
                return null;
            }

            // If state was idle, don't restore
            if (state.status === 'idle') {
                return null;
            }

            logger.info('Restoring pomodoro state from localStorage', {
                status: state.status,
                sessionType: state.sessionType,
                timeLeft: state.timeLeft
            });

            return state;
        } catch (error) {
            logger.error('Error loading pomodoro state', error as Error);
            return null;
        }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const persistedState = useMemo(() => loadPersistedState(), []);

    const [timeLeft, setTimeLeft] = useState(persistedState?.timeLeft ?? settings.workDuration);
    const [status, setStatus] = useState<TimerStatus>(persistedState?.status ?? 'idle');
    const [sessionType, setSessionType] = useState<'work' | 'break'>(persistedState?.sessionType ?? 'work');
    const [completedCycles, setCompletedCycles] = useState(persistedState?.completedCycles ?? 0);
    const [currentSessionStart, setCurrentSessionStart] = useState<number | null>(persistedState?.currentSessionStart ?? null);
    const [initialTimeLeft, setInitialTimeLeft] = useState(persistedState?.initialTimeLeft ?? settings.workDuration);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Save state to localStorage whenever it changes
    useEffect(() => {
        try {
            const state: PersistedTimerState = {
                timeLeft,
                status,
                sessionType,
                completedCycles,
                currentSessionStart,
                initialTimeLeft,
                savedAt: Date.now()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            logger.error('Error saving pomodoro state', error as Error);
        }
    }, [timeLeft, status, sessionType, completedCycles, currentSessionStart, initialTimeLeft]);

    // Restore running timer on mount
    useEffect(() => {
        if (persistedState && persistedState.status === 'running' && persistedState.currentSessionStart && persistedState.timeLeft !== undefined) {
            const elapsed = Math.floor((Date.now() - persistedState.currentSessionStart) / 1000);
            const remaining = persistedState.timeLeft - elapsed;

            if (remaining > 0) {
                logger.info('Resuming pomodoro timer', {
                    elapsed,
                    remaining,
                    sessionType: persistedState.sessionType
                });
                setTimeLeft(remaining);
                setStatus('running');
            } else {
                logger.info('Pomodoro session completed while away', {
                    sessionType: persistedState.sessionType
                });
                // Session completed while user was away
                setTimeLeft(0);
            }
        }
    }, []); // Run only on mount

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
    }, [status, timeLeft, handleSessionComplete]);

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
        // Clear persisted state
        try {
            localStorage.removeItem(STORAGE_KEY);
            logger.info('Pomodoro state cleared from localStorage');
        } catch (error) {
            logger.error('Error clearing pomodoro state', error as Error);
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