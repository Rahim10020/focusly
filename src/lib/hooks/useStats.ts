import { useLocalStorage } from './useLocalStorage';
import { Stats, PomodoroSession } from '@/types';
import { STORAGE_KEYS } from '@/lib/constants';
import { useCallback, useMemo } from 'react';

export function useStats() {
    const [stats, setStats] = useLocalStorage<Stats>(STORAGE_KEYS.STATS, {
        totalFocusTime: 0,
        totalTasks: 0,
        completedTasks: 0,
        totalSessions: 0,
        streak: 0,
    });

    const [sessions, setSessions] = useLocalStorage<PomodoroSession[]>(
        STORAGE_KEYS.SESSIONS,
        []
    );

    const addSession = useCallback((session: PomodoroSession) => {
        setSessions(prevSessions => [...prevSessions, session]);

        if (session.completed && session.type === 'work') {
            setStats(prevStats => ({
                ...prevStats,
                totalFocusTime: prevStats.totalFocusTime + Math.floor(session.duration / 60),
                totalSessions: prevStats.totalSessions + 1,
            }));
        }
    }, [setSessions, setStats]);

    const updateTaskStats = useCallback((totalTasks: number, completedTasks: number) => {
        setStats(prevStats => {
            // Ne mettre à jour que si les valeurs ont changé
            if (prevStats.totalTasks === totalTasks && prevStats.completedTasks === completedTasks) {
                return prevStats;
            }
            return {
                ...prevStats,
                totalTasks,
                completedTasks,
            };
        });
    }, [setStats]);

    const getTodaySessions = useCallback(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = today.getTime();

        return sessions.filter(
            session => session.startedAt >= todayTimestamp && session.completed
        );
    }, [sessions]);

    const getTodayFocusTime = useCallback(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = today.getTime();

        return sessions
            .filter(
                session =>
                    session.completed &&
                    session.type === 'work' &&
                    session.startedAt >= todayTimestamp
            )
            .reduce((total, session) => total + session.duration, 0);
    }, [sessions]);

    return {
        stats,
        sessions,
        addSession,
        updateTaskStats,
        getTodaySessions,
        getTodayFocusTime,
    };
}