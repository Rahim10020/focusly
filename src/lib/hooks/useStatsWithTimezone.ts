/**
 * @fileoverview Enhanced statistics hook with timezone support.
 * Provides accurate streak calculation based on user's local timezone.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Stats } from '@/types';
import { supabaseClient } from '@/lib/supabase/client';
import { StreakService, Session } from '@/lib/services/streakService';
import { retryWithBackoff } from '@/lib/utils/retry';
import { useToastContext } from '@/components/providers/ToastProvider';
import { logger } from '@/lib/logger';

/**
 * Hook for managing statistics with timezone-aware streak calculation
 */
export function useStatsWithTimezone() {
    const { data: session } = useSession();
    const { error: showErrorToast } = useToastContext();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchSessions = useCallback(async (): Promise<Session[]> => {
        const userId = session?.user?.id;
        if (!userId) return [];

        try {
            const { data, error } = await supabaseClient
                .from('sessions')
                .select('*')
                .eq('user_id', userId)
                .eq('completed', true)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching sessions:', error);
                logger.error('Supabase sessions query failed', error, {
                    action: 'fetchSessions',
                    userId,
                    errorCode: (error as any)?.code,
                    errorMessage: (error as any)?.message
                });
                return [];
            }

            return (data || []).map((s: any) => ({
                id: s.id,
                user_id: s.user_id,
                completed_at: s.completed_at || s.created_at,
                duration: s.duration,
                type: s.type,
                completed: s.completed
            }));
        } catch (err) {
            console.error('Exception while fetching sessions:', err);
            logger.error('Exception during fetchSessions', err, {
                action: 'fetchSessions',
                userId
            });
            return [];
        }
    }, [session?.user?.id]);

    const refreshStats = useCallback(async () => {
        const userId = session?.user?.id;
        if (!userId) {
            setLoading(false);
            return;
        }

        setLoading(true);

        try {
            // Fetch sessions for streak calculation
            const sessions = await fetchSessions();
            const streakData = StreakService.calculateStreak(sessions);

            // Fetch other stats from database
            const { data: statsData, error } = await supabaseClient
                .from('stats')
                .select('total_sessions, completed_tasks, total_tasks, total_focus_time')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                logger.error('Stats query error', error, {
                    action: 'refreshStats - fetch stats',
                    userId,
                    errorCode: (error as any)?.code,
                    errorMessage: (error as any)?.message
                });
                throw error;
            }

            setStats({
                totalSessions: (statsData as any)?.total_sessions || 0,
                completedTasks: (statsData as any)?.completed_tasks || 0,
                totalTasks: (statsData as any)?.total_tasks || 0,
                totalFocusTime: (statsData as any)?.total_focus_time || 0,
                streak: streakData.current,
                longestStreak: streakData.longest,
            });

            // Update streaks in database
            const { error: upsertError } = await supabaseClient
                .from('stats')
                .upsert({
                    user_id: userId,
                    streak: streakData.current,
                    longest_streak: streakData.longest
                } as any, { onConflict: 'user_id' });

            if (upsertError) {
                logger.error('Stats upsert error', upsertError, {
                    action: 'refreshStats - upsert stats',
                    userId
                });
            }

        } catch (error: any) {
            logger.error('Error refreshing stats', error, {
                action: 'refreshStats',
                userId: session?.user?.id,
                errorMessage: error?.message,
                errorCode: error?.code
            });
            showErrorToast('Failed to load statistics', error?.message || 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, [session?.user?.id, fetchSessions, showErrorToast]);

    useEffect(() => {
        // Only refresh if we have a user session
        if (session?.user?.id) {
            refreshStats();
        } else {
            // Clear stats if no session
            setStats(null);
            setLoading(false);
        }
    }, [session?.user?.id, refreshStats]);

    return { stats, loading, refreshStats };
}
