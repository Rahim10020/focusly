/**
 * @fileoverview Hook for cached session data with multi-level caching.
 * Provides improved performance through memory and IndexedDB caching.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { supabaseClient } from '@/lib/supabase/client';
import { CacheService } from '@/lib/services/cacheService';
import { PomodoroSession } from '@/types';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface SessionData {
    id: string;
    user_id: string;
    type: string;
    duration: number;
    completed: boolean;
    task_id?: string;
    created_at: string;
}

/**
 * Hook for fetching sessions with multi-level caching
 */
export function useCachedSessions(timeRange: number = 30) {
    const { data: session } = useSession();
    const [sessions, setSessions] = useState<PomodoroSession[]>([]);
    const [loading, setLoading] = useState(true);

    const getUserId = () => session?.user?.id;
    const cacheKey = `sessions_${getUserId()}_${timeRange}days`;

    const fetchWithCache = useCallback(async () => {
        const userId = getUserId();
        if (!userId) {
            setLoading(false);
            return;
        }

        setLoading(true);

        // Level 1: Memory cache (React state)
        if (sessions.length > 0) {
            setLoading(false);
            return;
        }

        // Level 2: IndexedDB (persistent client-side)
        const cachedData = await CacheService.get<PomodoroSession[]>(cacheKey);
        const cachedMeta = await CacheService.get<{ timestamp: number }>(`${cacheKey}_meta`);

        if (cachedData && cachedMeta && !CacheService.isCacheExpired(cachedMeta.timestamp, CACHE_TTL)) {
            setSessions(cachedData);
            setLoading(false);
            return;
        }

        // Level 3: Server
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - timeRange);

            const { data: freshData, error } = await supabaseClient
                .from('sessions')
                .select('*')
                .eq('user_id', userId)
                .gte('created_at', startDate.toISOString())
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching sessions:', error);
                setLoading(false);
                return;
            }

            const formattedSessions: PomodoroSession[] = (freshData || []).map((s: SessionData) => ({
                id: s.id,
                type: s.type as 'work' | 'break',
                duration: s.duration,
                completed: s.completed,
                taskId: s.task_id,
                startedAt: new Date(s.created_at).getTime(),
                completedAt: s.completed ? new Date(s.created_at).getTime() + (s.duration * 1000) : undefined,
            }));

            setSessions(formattedSessions);

            // Update IndexedDB cache
            await CacheService.set(cacheKey, formattedSessions);
            await CacheService.set(`${cacheKey}_meta`, { timestamp: Date.now() });

        } catch (error) {
            console.error('Error in fetchWithCache:', error);
        } finally {
            setLoading(false);
        }
    }, [session?.user?.id, timeRange, cacheKey, sessions.length]);

    const invalidateCache = useCallback(async () => {
        await CacheService.delete(cacheKey);
        await CacheService.delete(`${cacheKey}_meta`);
        setSessions([]);
    }, [cacheKey]);

    useEffect(() => {
        fetchWithCache();
    }, [fetchWithCache]);

    return { sessions, loading, invalidateCache, refetch: fetchWithCache };
}
