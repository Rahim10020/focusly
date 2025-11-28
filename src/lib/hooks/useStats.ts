/**
 * @fileoverview Statistics calculation and tracking hook.
 * Manages user productivity statistics including focus time, completed tasks,
 * sessions, and streaks with database synchronization support.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useLocalStorage } from './useLocalStorage';
import { Stats, PomodoroSession } from '@/types';
import { STORAGE_KEYS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { useToastContext } from '@/components/providers/ToastProvider';
import { logger } from '@/lib/logger';
import { startOfDay, differenceInCalendarDays, parseISO } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

/**
 * Hook for managing and calculating user productivity statistics.
 * Tracks focus time, completed tasks, pomodoro sessions, and streaks.
 * Automatically syncs with Supabase when authenticated.
 *
 * @returns {Object} Statistics state and management functions
 * @returns {Stats} returns.stats - Current statistics object
 * @returns {PomodoroSession[]} returns.sessions - Array of all pomodoro sessions
 * @returns {boolean} returns.loading - Whether stats are being loaded
 * @returns {string|null} returns.error - Error message if any
 * @returns {Function} returns.addSession - Record a new pomodoro session
 * @returns {Function} returns.updateTaskStats - Update task completion statistics
 * @returns {Function} returns.getTodaySessions - Get all sessions from today
 * @returns {Function} returns.getTodayFocusTime - Get total focus time for today
 *
 * @example
 * const { stats, addSession, getTodayFocusTime } = useStats();
 *
 * // Record a completed session
 * await addSession({
 *   id: 'session-123',
 *   type: 'work',
 *   duration: 1500,
 *   completed: true,
 *   startedAt: Date.now() - 1500000,
 *   taskId: 'task-456'
 * });
 *
 * // Get today's focus time in seconds
 * const todayFocus = getTodayFocusTime();
 */
export function useStats() {
    const { data: session } = useSession();
    const { error: showErrorToast } = useToastContext();
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
    const [error, setError] = useState<string | null>(null);

    const getUserId = () => session?.user?.id;

    // Set Supabase auth session when user logs in
    useEffect(() => {
        if (session?.accessToken && session?.refreshToken) {
            supabase.auth.setSession({
                access_token: session.accessToken,
                refresh_token: session.refreshToken,
            });
        }
    }, [session]);

    // Load stats and sessions from database when user logs in
    useEffect(() => {
        const userId = getUserId();
        if (userId) {
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
    }, [session?.user?.id]);

    const loadStatsFromDB = async () => {
        const userId = getUserId();
        if (!userId) return;

        setLoading(true);
        setError(null);
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
                const statsData = data as {
                    total_focus_time: number;
                    total_tasks: number;
                    completed_tasks: number;
                    total_sessions: number;
                    streak: number;
                };
                setDbStats({
                    totalFocusTime: statsData.total_focus_time,
                    totalTasks: statsData.total_tasks,
                    completedTasks: statsData.completed_tasks,
                    totalSessions: statsData.total_sessions,
                    streak: statsData.streak,
                });
            }
        } catch (error: any) {
            logger.error('Error loading stats from DB', error, {
                action: 'loadStatsFromDB',
                userId: getUserId()
            });
            const errorMessage = error.message || 'Failed to load statistics from database';
            setError(errorMessage);
            showErrorToast('Failed to Load Statistics', errorMessage);
        } finally {
            setLoading(false);
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

            const formattedSessions: PomodoroSession[] = data.map((dbSession: any) => ({
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
            logger.error('Error loading sessions from DB', error as Error, {
                action: 'loadSessionsFromDB',
                userId: getUserId()
            });
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
                await (supabase
                    .from('sessions') as any)
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
                    await (supabase
                        .from('stats') as any)
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
                logger.error('Error adding session to DB', error as Error, {
                    action: 'addSession',
                    userId: getUserId()
                });
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
                await (supabase
                    .from('stats') as any)
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
                logger.error('Error updating task stats in DB', error as Error, {
                    action: 'updateTaskStats',
                    userId: getUserId()
                });
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

    const calculateStreak = useCallback((sessions: PomodoroSession[]): number => {
        if (sessions.length === 0) return 0;

        // Obtenir le fuseau horaire de l'utilisateur
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // Convertir toutes les dates en heure locale de l'utilisateur
        const workSessions = sessions
            .filter(s => s.completed && s.type === 'work' && s.startedAt)
            .map(s => {
                const utcDate = new Date(s.startedAt);
                return utcToZonedTime(utcDate, userTimezone);
            })
            .sort((a, b) => b.getTime() - a.getTime()); // Plus récent d'abord

        if (workSessions.length === 0) return 0;

        const today = startOfDay(utcToZonedTime(new Date(), userTimezone));
        const mostRecentSession = startOfDay(workSessions[0]);

        // Si la session la plus récente est > 1 jour dans le passé, streak = 0
        const daysDiff = differenceInCalendarDays(today, mostRecentSession);
        if (daysDiff > 1) return 0;

        let streak = 0;
        let currentDay = mostRecentSession;

        for (const sessionDate of workSessions) {
            const sessionDay = startOfDay(sessionDate);
            const diff = differenceInCalendarDays(currentDay, sessionDay);

            if (diff === 0) {
                // Même jour, continue
                continue;
            } else if (diff === 1) {
                // Jour consécutif
                streak++;
                currentDay = sessionDay;
            } else {
                // Gap > 1 jour, streak break
                break;
            }
        }

        // +1 pour inclure le jour le plus récent
        return streak + 1;
    }, []);

    const refreshStats = useCallback(async () => {
        const userId = getUserId();
        if (userId) {
            await loadStatsFromDB();
            await loadSessionsFromDB();
        }
    }, [getUserId]);

    return {
        stats: currentStats,
        sessions: currentSessions,
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