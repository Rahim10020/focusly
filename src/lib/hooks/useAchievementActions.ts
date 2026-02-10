/**
 * @fileoverview Achievement actions hook.
 * Handles checking and unlocking achievements.
 */

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Achievement } from '@/types';
import { supabaseClient } from '@/lib/supabase/client';
import { retryWithBackoff } from '@/lib/utils/retry';
import { checkAchievementProgress, checkTimeBasedAchievement, AchievementStats } from './useAchievementDefinitions';

interface UseAchievementActionsReturn {
    checkAchievements: (stats: AchievementStats) => void;
    checkTimeBasedAchievements: (hour: number) => void;
    newlyUnlocked: Achievement[];
    clearNewlyUnlocked: () => void;
}

interface UseAchievementActionsProps {
    setAchievements: React.Dispatch<React.SetStateAction<Achievement[]>>;
    notifiedAchievements: string[];
    setNotifiedAchievements: React.Dispatch<React.SetStateAction<string[]>>;
}

export function useAchievementActions({
    setAchievements,
    notifiedAchievements,
    setNotifiedAchievements,
}: UseAchievementActionsProps): UseAchievementActionsReturn {
    const { data: session } = useSession();
    const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);

    const getUserId = useCallback(() => session?.user?.id, [session]);

    const saveAchievementToDB = useCallback(async (achievementId: string) => {
        const userId = getUserId();
        if (!userId) return;

        try {
            await supabaseClient.auth.getSession();
            await retryWithBackoff(async () => {
                const result = await supabaseClient
                    .from('achievements')
                    .upsert({
                        user_id: userId,
                        achievement_id: achievementId,
                        unlocked_at: new Date().toISOString(),
                    }, { onConflict: 'user_id,achievement_id' });
                if (result.error) throw result.error;
            });
        } catch (error) {
            console.error('Error saving achievement to DB:', error);
        }
    }, [getUserId]);

    const checkAchievements = useCallback((stats: AchievementStats) => {
        setAchievements(prevAchievements => {
            const newlyUnlockedList: Achievement[] = [];

            const updated = prevAchievements.map(achievement => {
                if (achievement.unlockedAt) return achievement;

                const { shouldUnlock, currentProgress } = checkAchievementProgress(achievement.id, stats);

                if (shouldUnlock && !notifiedAchievements.includes(achievement.id)) {
                    const unlockedAchievement = {
                        ...achievement,
                        unlockedAt: Date.now(),
                        progress: achievement.target,
                    };
                    newlyUnlockedList.push(unlockedAchievement);
                    saveAchievementToDB(achievement.id);
                    return unlockedAchievement;
                }

                return { ...achievement, progress: currentProgress };
            });

            if (newlyUnlockedList.length > 0) {
                const toNotify = newlyUnlockedList.filter(
                    a => !notifiedAchievements.includes(a.id)
                );
                if (toNotify.length > 0) {
                    setNewlyUnlocked(prev => [...prev, ...toNotify]);
                    setNotifiedAchievements(prev => [...prev, ...toNotify.map(a => a.id)]);
                }
            }

            return updated;
        });
    }, [setAchievements, notifiedAchievements, setNotifiedAchievements, saveAchievementToDB]);

    const checkTimeBasedAchievements = useCallback((hour: number) => {
        setAchievements(prevAchievements => {
            const newlyUnlockedList: Achievement[] = [];

            const updated = prevAchievements.map(achievement => {
                if (achievement.unlockedAt) return achievement;

                if (checkTimeBasedAchievement(achievement.id, hour) &&
                    !notifiedAchievements.includes(achievement.id)) {
                    const unlockedAchievement = {
                        ...achievement,
                        unlockedAt: Date.now(),
                        progress: 1,
                    };
                    newlyUnlockedList.push(unlockedAchievement);
                    saveAchievementToDB(achievement.id);
                    return unlockedAchievement;
                }

                return achievement;
            });

            if (newlyUnlockedList.length > 0) {
                const toNotify = newlyUnlockedList.filter(
                    a => !notifiedAchievements.includes(a.id)
                );
                if (toNotify.length > 0) {
                    setNewlyUnlocked(prev => [...prev, ...toNotify]);
                    setNotifiedAchievements(prev => [...prev, ...toNotify.map(a => a.id)]);
                }
            }

            return updated;
        });
    }, [setAchievements, notifiedAchievements, setNotifiedAchievements, saveAchievementToDB]);

    const clearNewlyUnlocked = useCallback(() => {
        setNewlyUnlocked([]);
    }, []);

    return {
        checkAchievements,
        checkTimeBasedAchievements,
        newlyUnlocked,
        clearNewlyUnlocked,
    };
}
