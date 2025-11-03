import { useLocalStorage } from './useLocalStorage';
import { Stats, PomodoroSession } from '@/types';
import { STORAGE_KEYS } from '@/lib/constants';

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

    const addSession = (session: PomodoroSession) => {
        setSessions([...sessions, session]);

        if (session.completed && session.type === 'work') {
            setStats({
                ...stats,
                totalFocusTime: stats.totalFocusTime + Math.floor(session.duration / 60),
                totalSessions: stats.totalSessions + 1,
            });
        }
    };

    const updateTaskStats = (totalTasks: number, completedTasks: number) => {
        setStats({
            ...stats,
            totalTasks,
            completedTasks,
        });
    };

    const getTodaySessions = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = today.getTime();

        return sessions.filter(
            session => session.startedAt >= todayTimestamp && session.completed
        );
    };

    const getTodayFocusTime = () => {
        const todaySessions = getTodaySessions();
        return todaySessions
            .filter(session => session.type === 'work')
            .reduce((total, session) => total + session.duration, 0);
    };

    return {
        stats,
        sessions,
        addSession,
        updateTaskStats,
        getTodaySessions,
        getTodayFocusTime,
    };
}