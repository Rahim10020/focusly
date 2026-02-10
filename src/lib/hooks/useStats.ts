/**
 * @fileoverview Statistics calculation and tracking hook.
 * Manages user productivity statistics including focus time, completed tasks,
 * sessions, and streaks with database synchronization support.
 */

import { useMemo, useCallback } from 'react';
import { PomodoroSession } from '@/types';
import { useStatsStorage } from './useStatsStorage';
import { useStatsActions } from './useStatsActions';
import { getTodaySessions as getTodaySessionsUtil, getTodayFocusTime as getTodayFocusTimeUtil, calculateStreak as calculateStreakUtil } from './useStatsUtils';

export function useStats() {
    const {
        stats,
        sessions,
        loading,
        error,
        setStats,
        setSessions,
        loadStats,
        loadSessions,
    } = useStatsStorage();

    const { addSession, updateTaskStats, refreshStats } = useStatsActions({
        stats,
        sessions,
        setStats,
        setSessions,
        loadStats,
        loadSessions,
    });

    // Memoized computed values
    const todaySessions: PomodoroSession[] = useMemo(
        () => getTodaySessionsUtil(sessions),
        [sessions]
    );
    const todayFocusTime: number = useMemo(
        () => getTodayFocusTimeUtil(sessions),
        [sessions]
    );

    const getTodaySessions = useCallback((): PomodoroSession[] => todaySessions, [todaySessions]);
    const getTodayFocusTime = useCallback((): number => todayFocusTime, [todayFocusTime]);
    const calculateStreak = useCallback((): number => calculateStreakUtil(sessions), [sessions]);

    return {
        stats,
        sessions,
        loading,
        error,
        addSession,
        updateTaskStats,
        getTodaySessions,
        getTodayFocusTime,
        refreshStats,
        calculateStreak,
    };
}
