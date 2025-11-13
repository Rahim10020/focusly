import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useLocalStorage } from './useLocalStorage';
import { Stats, PomodoroSession } from '@/types';
import { STORAGE_KEYS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';

export function useStats() {
    const { data: session } = useSession();
    const [localStats, setLocalStats] = useLocalStorage<Stats>(STORAGE_KEYS.STATS, {
        totalFocusTime: 0,
        totalTasks: 0,
        completedTasks: 0,
        totalSessions: 0,
        streak: 0,
    });

    const [localSessions, setLocalSessions] = useLocalStorage<PomodoroSession[]>(
        STORAGE_KEYS.SESSIONS,
        []
    );

    const [dbStats, setDbStats] = useState<Stats>({
        totalFocusTime: 0,
        totalTasks: 0,
        completedTasks: 0,
        totalSessions: 0,
        streak: 0,
    });

    const [dbSessions, setDbSessions] = useState<PomodoroSession[]>([]);
    const [loading, setLoading] = useState(false);

    const getUserId = () => (session?.user as any)?.id;

    // Load stats and sessions from database when user logs in
    useEffect(() => {
        if (getUserId()) {
            loadStatsFromDB();
            loadSessionsFromDB();
        } else {
            setDbStats({
                totalFocusTime: 0,
                totalTasks: 0,
                completedTasks: 0,
                totalSessions: 0,
                streak: 0,
            });
            setDbSessions([]);
        }
    }, [getUserId()]);

    const loadStatsFromDB = async () => {
        const userId = getUserId();
        if (!userId) return;

        try {
            const { data, error } = await supabase
                .from('stats')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                throw error;
            }

            if (data) {
                setDbStats({
                    totalFocusTime: data.total_focus_time,
                    totalTasks: data.total_tasks,
                    completedTasks: data.completed_tasks,
                    totalSessions: data.total_sessions,
                    streak: data.streak,
                });
            }
        } catch (error) {
            console.error('Error loading stats from DB:', error);
        }
    };

    const loadSessionsFromDB = async () => {
        const userId = getUserId();
        if (!userId) return;

        try {
            const { data, error } = await supabase
                .from('sessions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedSessions: PomodoroSession[] = data.map(dbSession => ({
                id: dbSession.id,
                type: dbSession.type,
                duration: dbSession.duration,
                completed: dbSession.completed,
                taskId: dbSession.task_id,
                startedAt: new Date(dbSession.created_at).getTime(),
                completedAt: dbSession.completed ? new Date(dbSession.created_at).getTime() + (dbSession.duration * 1000) : undefined,
            }));

            setDbSessions(formattedSessions);
        } catch (error) {
            console.error('Error loading sessions from DB:', error);
        }
    };

    const currentStats = getUserId() ? dbStats : localStats;
    const currentSessions = getUserId() ? dbSessions : localSessions;
    const setCurrentStats = getUserId() ? setDbStats : setLocalStats;
    const setCurrentSessions = getUserId() ? setDbSessions : setLocalSessions;

    const addSession = useCallback(async (session: PomodoroSession) => {
        const userId = getUserId();
        if (userId) {
            // Save to database
            try {
                await supabase
                    .from('sessions')
                    .insert({
                        user_id: userId,
                        task_id: session.taskId,
                        duration: session.duration,
                        type: session.type,
                        completed: session.completed,
                        created_at: new Date(session.startedAt).toISOString(),
                    });

                // Update stats in database
                if (session.completed && session.type === 'work') {
                    await supabase
                        .from('stats')
                        .upsert({
                            user_id: userId,
                            total_focus_time: dbStats.totalFocusTime + Math.floor(session.duration / 60),
                            total_sessions: dbStats.totalSessions + 1,
                        }, { onConflict: 'user_id' });
                }

                setCurrentSessions(prevSessions => [...prevSessions, session]);

                if (session.completed && session.type === 'work') {
                    setCurrentStats(prevStats => ({
                        ...prevStats,
                        totalFocusTime: prevStats.totalFocusTime + Math.floor(session.duration / 60),
                        totalSessions: prevStats.totalSessions + 1,
                    }));
                }
            } catch (error) {
                console.error('Error adding session to DB:', error);
            }
        } else {
            // Save to localStorage
            setCurrentSessions(prevSessions => [...prevSessions, session]);

            if (session.completed && session.type === 'work') {
                setCurrentStats(prevStats => ({
                    ...prevStats,
                    totalFocusTime: prevStats.totalFocusTime + Math.floor(session.duration / 60),
                    totalSessions: prevStats.totalSessions + 1,
                }));
            }
        }
    }, [getUserId, dbStats, setCurrentSessions, setCurrentStats]);

    const updateTaskStats = useCallback(async (totalTasks: number, completedTasks: number) => {
        const userId = getUserId();
        if (userId) {
            // Update in database
            try {
                await supabase
                    .from('stats')
                    .upsert({
                        user_id: userId,
                        total_tasks: totalTasks,
                        completed_tasks: completedTasks,
                    }, { onConflict: 'user_id' });

                setCurrentStats(prevStats => {
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
            } catch (error) {
                console.error('Error updating task stats in DB:', error);
            }
        } else {
            // Update in localStorage
            setCurrentStats(prevStats => {
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
        }
    }, [getUserId, setCurrentStats]);

    const getTodaySessions = useCallback(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = today.getTime();

        return currentSessions.filter(
            (session: PomodoroSession) => session.startedAt >= todayTimestamp && session.completed
        );
    }, [currentSessions]);

    const getTodayFocusTime = useCallback(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = today.getTime();

        return currentSessions
            .filter(
                (session: PomodoroSession) =>
                    session.completed &&
                    session.type === 'work' &&
                    session.startedAt >= todayTimestamp
            )
            .reduce((total: number, session: PomodoroSession) => total + session.duration, 0);
    }, [currentSessions]);

    return {
        stats: currentStats,
        sessions: currentSessions,
        addSession,
        updateTaskStats,
        getTodaySessions,
        getTodayFocusTime,
    };
}