/**
 * @fileoverview Achievement storage hook.
 * Handles switching between localStorage and Supabase based on authentication.
 */

import { useState, useCallback, Dispatch, SetStateAction } from 'react';
import { useSession } from 'next-auth/react';
import { useLocalStorage } from './useLocalStorage';
import { Achievement } from '@/types';
import { ACHIEVEMENT_DEFINITIONS } from './useAchievementDefinitions';
import { supabaseClient } from '@/lib/supabase/client';
import { retryWithBackoff } from '@/lib/utils/retry';

interface UseAchievementStorageReturn {
    achievements: Achievement[];
    setAchievements: Dispatch<SetStateAction<Achievement[]>>;
    loading: boolean;
    loadAchievements: () => Promise<void>;
}

export function useAchievementStorage(): UseAchievementStorageReturn {
    const { data: session } = useSession();
    const [localAchievements, setLocalAchievements] = useLocalStorage<Achievement[]>(
        'focusly_achievements',
        ACHIEVEMENT_DEFINITIONS.map(def => ({ ...def, progress: 0 }))
    );
    const [dbAchievements, setDbAchievements] = useState<Achievement[]>(
        ACHIEVEMENT_DEFINITIONS.map(def => ({ ...def, progress: 0 }))
    );
    const [loading, setLoading] = useState(false);

    const getUserId = useCallback(() => session?.user?.id, [session]);
    const isAuthenticated = !!getUserId();
    const achievements = isAuthenticated ? dbAchievements : localAchievements;
    const setAchievements: Dispatch<SetStateAction<Achievement[]>> = isAuthenticated
        ? setDbAchievements
        : setLocalAchievements;

    const loadAchievements = useCallback(async () => {
        const userId = getUserId();
        if (!userId) return;

        setLoading(true);
        try {
            const { data, error } = await retryWithBackoff(async () => {
                const result = await supabaseClient
                    .from('achievements')
                    .select('*')
                    .eq('user_id', userId);
                if (result.error) throw result.error;
                return result;
            });

            if (error || !data) throw error;

            const achievementData = data as { achievement_id: string; unlocked_at: string }[];
            const formattedAchievements = ACHIEVEMENT_DEFINITIONS.map(def => {
                const dbAchievement = achievementData.find((a) => a.achievement_id === def.id);
                return {
                    ...def,
                    progress: 0,
                    unlockedAt: dbAchievement ? new Date(dbAchievement.unlocked_at).getTime() : undefined,
                };
            });

            setDbAchievements(formattedAchievements);
        } catch (error) {
            console.error('Error loading achievements:', error);
        } finally {
            setLoading(false);
        }
    }, [getUserId]);

    return {
        achievements,
        setAchievements,
        loading,
        loadAchievements,
    };
}
