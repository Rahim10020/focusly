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

    const getUserId = () => session?.user?.id;

    const fetchSessions = useCallback(async (): Promise<Session[]> => {
        const userId = getUserId();
        if (!userId) return [];

        const { data, error } = await supabaseClient
            .from('sessions')
            .select('*')
            .eq('user_id', userId)
            .eq('completed', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching sessions:', error);
            return [];
        }

        return (data || []).map((s: any) => ({
            id: s.id,
            user_id: s.user_id,
            completed_at: s.created_at,
            duration: s.duration,
            type: s.type,
            completed: s.completed
        }));
    }, [session?.user?.id]);

    const refreshStats = useCallback(async () => {
        const userId = getUserId();
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

            if (error && error.code !== 'PGRST116') throw error;

            setStats({
                totalSessions: (statsData as any)?.total_sessions || 0,
                completedTasks: (statsData as any)?.completed_tasks || 0,
                totalTasks: (statsData as any)?.total_tasks || 0,
                totalFocusTime: (statsData as any)?.total_focus_time || 0,
                streak: streakData.current,
                longestStreak: streakData.longest,
            });

            // Update streaks in database
            await supabaseClient
                .from('stats')
                .upsert({
                    user_id: userId,
                    streak: streakData.current,
                    longest_streak: streakData.longest
                } as any, { onConflict: 'user_id' });

        } catch (error: any) {
            logger.error('Error refreshing stats', error, {
                action: 'refreshStats',
                userId: getUserId()
            });
            showErrorToast('Failed to load statistics', error.message);
        } finally {
            setLoading(false);
        }
    }, [getUserId, fetchSessions, showErrorToast]);

    useEffect(() => {
        refreshStats();
    }, [refreshStats]);

    return { stats, loading, refreshStats };
}
