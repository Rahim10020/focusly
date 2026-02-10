/**
 * @fileoverview Main achievements hook.
 * Composes all achievement-related hooks together.
 */

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Achievement } from '@/types';
import { ACHIEVEMENT_DEFINITIONS, initAchievementStats, AchievementStats } from './useAchievementDefinitions';
import { useAchievementStorage } from './useAchievementStorage';
import { useAchievementActions } from './useAchievementActions';

export function useAchievements() {
    const { data: session } = useSession();
    const { achievements, setAchievements, loadAchievements } = useAchievementStorage();
    const [notifiedAchievements, setNotifiedAchievements] = useState<string[]>([]);
    const [stats, setStats] = useState<AchievementStats>(initAchievementStats());
    const [isLoaded, setIsLoaded] = useState(false);

    // Load achievements when session changes
    useEffect(() => {
        const loadData = async () => {
            await loadAchievements();
            const stored = localStorage.getItem('focusly_notified_achievements');
            setNotifiedAchievements(stored ? JSON.parse(stored) : []);
            setIsLoaded(true);
        };
        loadData();
    }, [session, loadAchievements]);

    // Calculate stats from achievements
    useEffect(() => {
        setStats(initAchievementStats(achievements));
    }, [achievements]);

    // Update notified achievements in localStorage
    useEffect(() => {
        localStorage.setItem('focusly_notified_achievements', JSON.stringify(notifiedAchievements));
    }, [notifiedAchievements]);

    // Actions
    const { checkAchievements, checkTimeBasedAchievements, newlyUnlocked, clearNewlyUnlocked } = useAchievementActions({
        setAchievements,
        notifiedAchievements,
        setNotifiedAchievements,
    });

    // Initialize or reset achievements
    const resetAchievements = useCallback(async () => {
        const reset: Achievement[] = ACHIEVEMENT_DEFINITIONS.map(def => ({
            ...def,
            unlockedAt: undefined,
            progress: 0,
        }));
        setAchievements(reset);
        setNotifiedAchievements([]);
        setStats(initAchievementStats());
    }, [setAchievements]);

    // Reset specific achievement
    const resetAchievement = useCallback(async (id: string) => {
        setAchievements((prev: Achievement[]) => prev.map(a =>
            a.id === id ? { ...a, unlockedAt: undefined, progress: 0 } : a
        ));
    }, [setAchievements]);

    return {
        achievements,
        notifiedAchievements,
        stats,
        isLoaded,
        checkAchievements,
        checkTimeBasedAchievements,
        resetAchievements,
        resetAchievement,
        newlyUnlocked,
        clearNewlyUnlocked,
        unlockedAchievements: achievements.filter(a => a.unlockedAt),
        lockedAchievements: achievements.filter(a => !a.unlockedAt),
    };
}
