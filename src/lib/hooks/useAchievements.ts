/**
 * @fileoverview Achievement tracking and unlocking hook.
 * Manages gamification achievements based on user activity including
 * completed tasks, pomodoro sessions, streaks, and focus time milestones.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useLocalStorage } from './useLocalStorage';
import { Achievement } from '@/types';
import { supabase } from '@/lib/supabase';

/**
 * Predefined achievement definitions with targets and metadata.
 * Includes beginner and expert level achievements for various milestones.
 * @constant
 */
const ACHIEVEMENTS_DEFINITIONS: Omit<Achievement, 'unlockedAt' | 'progress'>[] = [
    // Beginner Level Achievements
    {
        id: 'first_task',
        title: 'Getting Started',
        description: 'Complete your first task',
        icon: '🎯',
        level: 'beginner',
        target: 1,
    },
    {
        id: 'first_pomodoro',
        title: 'First Focus',
        description: 'Complete your first pomodoro session',
        icon: '🍅',
        level: 'beginner',
        target: 1,
    },
    {
        id: 'pomodoro_10',
        title: 'Focused Warrior',
        description: 'Complete 10 pomodoro sessions',
        icon: '⚔️',
        level: 'beginner',
        target: 10,
    },
    {
        id: 'tasks_10',
        title: 'Task Crusher',
        description: 'Complete 10 tasks',
        icon: '💪',
        level: 'beginner',
        target: 10,
    },
    {
        id: 'streak_3',
        title: '3-Day Streak',
        description: 'Work 3 days in a row',
        icon: '🔥',
        level: 'beginner',
        target: 3,
    },
    {
        id: 'focus_time_60',
        title: 'Hour of Power',
        description: 'Focus for 60 minutes in a day',
        icon: '⏰',
        level: 'beginner',
        target: 60,
    },
    {
        id: 'early_bird',
        title: 'Early Bird',
        description: 'Complete a pomodoro before 9 AM',
        icon: '🌅',
        level: 'beginner',
        target: 1,
    },
    {
        id: 'night_owl',
        title: 'Night Owl',
        description: 'Complete a pomodoro after 10 PM',
        icon: '🦉',
        level: 'beginner',
        target: 1,
    },

    // Expert Level Achievements
    {
        id: 'pomodoro_50',
        title: 'Focus Master',
        description: 'Complete 50 pomodoro sessions',
        icon: '👑',
        level: 'expert',
        target: 50,
    },
    {
        id: 'pomodoro_100',
        title: 'Centurion',
        description: 'Complete 100 pomodoro sessions',
        icon: '🏆',
        level: 'expert',
        target: 100,
    },
    {
        id: 'pomodoro_500',
        title: 'Focus Legend',
        description: 'Complete 500 pomodoro sessions',
        icon: '🌟',
        level: 'expert',
        target: 500,
    },
    {
        id: 'tasks_50',
        title: 'Productivity Pro',
        description: 'Complete 50 tasks',
        icon: '💼',
        level: 'expert',
        target: 50,
    },
    {
        id: 'tasks_200',
        title: 'Task Master',
        description: 'Complete 200 tasks',
        icon: '🎖️',
        level: 'expert',
        target: 200,
    },
    {
        id: 'streak_7',
        title: 'Week Warrior',
        description: 'Work 7 days in a row',
        icon: '⚡',
        level: 'expert',
        target: 7,
    },
    {
        id: 'streak_30',
        title: 'Monthly Master',
        description: 'Work 30 days in a row',
        icon: '💎',
        level: 'expert',
        target: 30,
    },
    {
        id: 'streak_100',
        title: 'Century Streak',
        description: 'Work 100 days in a row',
        icon: '🔥',
        level: 'expert',
        target: 100,
    },
    {
        id: 'focus_time_240',
        title: 'Deep Work Champion',
        description: 'Focus for 4 hours in a day',
        icon: '🧠',
        level: 'expert',
        target: 240,
    },
    {
        id: 'focus_time_480',
        title: 'Ultra Focus',
        description: 'Focus for 8 hours in a day',
        icon: '🎯',
        level: 'expert',
        target: 480,
    },
    {
        id: 'daily_tasks_20',
        title: 'Daily Dynamo',
        description: 'Complete 20 tasks in a single day',
        icon: '⚡',
        level: 'expert',
        target: 20,
    },
    {
        id: 'monthly_sessions_100',
        title: 'Monthly Momentum',
        description: 'Complete 100 pomodoro sessions in one month',
        icon: '📅',
        level: 'expert',
        target: 100,
    },
];

/**
 * Hook for tracking and managing user achievements.
 * Automatically checks and unlocks achievements based on user statistics
 * and activity. Syncs with Supabase when authenticated.
 *
 * @returns {Object} Achievement state and management functions
 * @returns {Achievement[]} returns.achievements - All achievements with progress
 * @returns {Achievement[]} returns.unlockedAchievements - Only unlocked achievements
 * @returns {Achievement[]} returns.lockedAchievements - Only locked achievements
 * @returns {Achievement[]} returns.newlyUnlocked - Recently unlocked achievements for notifications
 * @returns {Function} returns.checkAchievements - Check and unlock achievements based on stats
 * @returns {Function} returns.checkTimeBasedAchievements - Check time-based achievements (early bird, night owl)
 * @returns {Function} returns.clearNewlyUnlocked - Clear the newly unlocked achievements list
 *
 * @example
 * const { achievements, checkAchievements, newlyUnlocked } = useAchievements();
 *
 * // Check achievements after completing a task
 * checkAchievements({
 *   totalSessions: 10,
 *   completedTasks: 5,
 *   streak: 3,
 *   todayFocusMinutes: 120
 * });
 *
 * // Show notifications for newly unlocked achievements
 * newlyUnlocked.forEach(achievement => {
 *   showNotification(`Achievement unlocked: ${achievement.title}`);
 * });
 */
export function useAchievements() {
    const { data: session } = useSession();
    const [localAchievements, setLocalAchievements] = useLocalStorage<Achievement[]>(
        'focusly_achievements',
        ACHIEVEMENTS_DEFINITIONS.map(def => ({ ...def, progress: 0 }))
    );

    const [dbAchievements, setDbAchievements] = useState<Achievement[]>(
        ACHIEVEMENTS_DEFINITIONS.map(def => ({ ...def, progress: 0 }))
    );

    const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);
    const [notifiedAchievements, setNotifiedAchievements] = useLocalStorage<string[]>(
        'focusly_notified_achievements',
        []
    );
    const [loading, setLoading] = useState(false);

    const getUserId = () => session?.user?.id;

    // Set Supabase auth session when user logs in
    useEffect(() => {
        if (session?.accessToken && session?.refreshToken) {
            supabase.auth.setSession({
                access_token: session.accessToken,
                refresh_token: session.refreshToken,
            }).catch((error: unknown) => {
                console.error('Error setting Supabase session:', error);
            });
        }
    }, [session]);

    // Load achievements from database when user logs in
    useEffect(() => {
        const userId = getUserId();
        if (userId) {
            loadAchievementsFromDB();
        } else {
            setDbAchievements(ACHIEVEMENTS_DEFINITIONS.map(def => ({ ...def, progress: 0 })));
        }
    }, [session?.user?.id]);

    const loadAchievementsFromDB = async () => {
        const userId = getUserId();
        if (!userId) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('achievements')
                .select('*')
                .eq('user_id', userId);

            if (error || !data) throw error;

            // Merge with definitions
            const achievementData = data as { achievement_id: string; unlocked_at: string }[];
            const achievementsWithData = ACHIEVEMENTS_DEFINITIONS.map(def => {
                const dbAchievement = achievementData.find((a) => a.achievement_id === def.id);
                return {
                    ...def,
                    progress: 0, // Progress is calculated dynamically
                    unlockedAt: dbAchievement ? new Date(dbAchievement.unlocked_at).getTime() : undefined,
                };
            });

            setDbAchievements(achievementsWithData);
        } catch (error) {
            console.error('Error loading achievements from DB:', error);
        } finally {
            setLoading(false);
        }
    };

    const currentAchievements = getUserId() ? dbAchievements : localAchievements;
    const setCurrentAchievements = getUserId() ? setDbAchievements : setLocalAchievements;

    // Helper function to ensure Supabase session is set
    const ensureSupabaseSession = async () => {
        const { data: { session: supabaseSession } } = await supabase.auth.getSession();
        if (!supabaseSession && session?.accessToken && session?.refreshToken) {
            await supabase.auth.setSession({
                access_token: session.accessToken,
                refresh_token: session.refreshToken,
            });
        }
    };

    // Check and unlock achievements
    const checkAchievements = useCallback(async (stats: {
        totalSessions: number;
        completedTasks: number;
        streak: number;
        todayFocusMinutes: number;
    }) => {
        const userId = getUserId();
        const currentSession = session;
        setCurrentAchievements((prevAchievements: Achievement[]) => {
            let hasChanges = false;
            const newlyUnlockedAchievements: Achievement[] = [];

            const updated = prevAchievements.map((achievement: Achievement) => {
                if (achievement.unlockedAt) return achievement;

                let shouldUnlock = false;
                let currentProgress = 0;

                switch (achievement.id) {
                    case 'first_task':
                        currentProgress = stats.completedTasks;
                        shouldUnlock = stats.completedTasks >= 1;
                        break;
                    case 'first_pomodoro':
                        currentProgress = stats.totalSessions;
                        shouldUnlock = stats.totalSessions >= 1;
                        break;
                    case 'pomodoro_10':
                        currentProgress = stats.totalSessions;
                        shouldUnlock = stats.totalSessions >= 10;
                        break;
                    case 'pomodoro_50':
                        currentProgress = stats.totalSessions;
                        shouldUnlock = stats.totalSessions >= 50;
                        break;
                    case 'pomodoro_100':
                        currentProgress = stats.totalSessions;
                        shouldUnlock = stats.totalSessions >= 100;
                        break;
                    case 'pomodoro_500':
                        currentProgress = stats.totalSessions;
                        shouldUnlock = stats.totalSessions >= 500;
                        break;
                    case 'tasks_10':
                        currentProgress = stats.completedTasks;
                        shouldUnlock = stats.completedTasks >= 10;
                        break;
                    case 'tasks_50':
                        currentProgress = stats.completedTasks;
                        shouldUnlock = stats.completedTasks >= 50;
                        break;
                    case 'tasks_200':
                        currentProgress = stats.completedTasks;
                        shouldUnlock = stats.completedTasks >= 200;
                        break;
                    case 'streak_3':
                        currentProgress = stats.streak;
                        shouldUnlock = stats.streak >= 3;
                        break;
                    case 'streak_7':
                        currentProgress = stats.streak;
                        shouldUnlock = stats.streak >= 7;
                        break;
                    case 'streak_30':
                        currentProgress = stats.streak;
                        shouldUnlock = stats.streak >= 30;
                        break;
                    case 'streak_100':
                        currentProgress = stats.streak;
                        shouldUnlock = stats.streak >= 100;
                        break;
                    case 'focus_time_60':
                        currentProgress = stats.todayFocusMinutes;
                        shouldUnlock = stats.todayFocusMinutes >= 60;
                        break;
                    case 'focus_time_240':
                        currentProgress = stats.todayFocusMinutes;
                        shouldUnlock = stats.todayFocusMinutes >= 240;
                        break;
                    case 'focus_time_480':
                        currentProgress = stats.todayFocusMinutes;
                        shouldUnlock = stats.todayFocusMinutes >= 480;
                        break;
                    // Note: daily_tasks_20 and monthly_sessions_100 require additional tracking
                    // that would need to be implemented separately
                }

                if (shouldUnlock && !achievement.unlockedAt) {
                    hasChanges = true;
                    const unlockedAchievement = {
                        ...achievement,
                        unlockedAt: Date.now(),
                        progress: achievement.target,
                    };
                    newlyUnlockedAchievements.push(unlockedAchievement);

                    // Save to database if authenticated
                    if (userId) {
                        (async () => {
                            try {
                                await ensureSupabaseSession();
                                const { error } = await (supabase
                                    .from('achievements') as any)
                                    .upsert({
                                        user_id: userId,
                                        achievement_id: achievement.id,
                                        unlocked_at: new Date().toISOString(),
                                    }, { onConflict: 'user_id,achievement_id' });

                                if (error) {
                                    console.error('Error saving achievement to DB:', {
                                        message: error.message,
                                        details: error.details,
                                        hint: error.hint,
                                        code: error.code,
                                        achievementId: achievement.id,
                                        userId: userId
                                    });
                                }
                            } catch (error) {
                                console.error('Error in achievement save process:', error);
                            }
                        })();
                    }

                    return unlockedAchievement;
                }

                // Update progress même si pas débloqué
                if (achievement.progress !== currentProgress) {
                    hasChanges = true;
                }

                return {
                    ...achievement,
                    progress: currentProgress,
                };
            });

            // Mettre à jour newlyUnlocked en dehors du setState pour éviter les boucles
            if (newlyUnlockedAchievements.length > 0) {
                // Filtrer les achievements déjà notifiés
                const achievementsToNotify = newlyUnlockedAchievements.filter(
                    achievement => !notifiedAchievements.includes(achievement.id)
                );

                if (achievementsToNotify.length > 0) {
                    setNewlyUnlocked(prev => [...prev, ...achievementsToNotify]);
                    // Marquer ces achievements comme notifiés
                    setNotifiedAchievements(prev => [
                        ...prev,
                        ...achievementsToNotify.map(a => a.id)
                    ]);
                }
            }

            return hasChanges ? updated : prevAchievements;
        });
    }, [getUserId, setCurrentAchievements, session, ensureSupabaseSession, notifiedAchievements, setNotifiedAchievements]);

    const checkTimeBasedAchievements = useCallback(async (hour: number) => {
        const userId = getUserId();
        const currentSession = session;
        setCurrentAchievements((prevAchievements: Achievement[]) => {
            let hasChanges = false;
            const newlyUnlockedAchievements: Achievement[] = [];

            const updated = prevAchievements.map((achievement: Achievement) => {
                if (achievement.unlockedAt) return achievement;

                if (achievement.id === 'early_bird' && hour < 9) {
                    hasChanges = true;
                    const unlockedAchievement = {
                        ...achievement,
                        unlockedAt: Date.now(),
                        progress: 1,
                    };
                    newlyUnlockedAchievements.push(unlockedAchievement);

                    // Save to database if authenticated
                    if (userId) {
                        (async () => {
                            try {
                                await ensureSupabaseSession();
                                const { error } = await (supabase
                                    .from('achievements') as any)
                                    .upsert({
                                        user_id: userId,
                                        achievement_id: achievement.id,
                                        unlocked_at: new Date().toISOString(),
                                    }, { onConflict: 'user_id,achievement_id' });

                                if (error) {
                                    console.error('Error saving time-based achievement to DB:', {
                                        message: error.message,
                                        details: error.details,
                                        hint: error.hint,
                                        code: error.code,
                                        achievementId: achievement.id,
                                        userId: userId
                                    });
                                }
                            } catch (error) {
                                console.error('Error in time-based achievement save process:', error);
                            }
                        })();
                    }

                    return unlockedAchievement;
                }

                if (achievement.id === 'night_owl' && hour >= 22) {
                    hasChanges = true;
                    const unlockedAchievement = {
                        ...achievement,
                        unlockedAt: Date.now(),
                        progress: 1,
                    };
                    newlyUnlockedAchievements.push(unlockedAchievement);

                    // Save to database if authenticated
                    if (userId) {
                        (async () => {
                            try {
                                await ensureSupabaseSession();
                                const { error } = await (supabase
                                    .from('achievements') as any)
                                    .upsert({
                                        user_id: userId,
                                        achievement_id: achievement.id,
                                        unlocked_at: new Date().toISOString(),
                                    }, { onConflict: 'user_id,achievement_id' });

                                if (error) {
                                    console.error('Error saving time-based achievement to DB:', {
                                        message: error.message,
                                        details: error.details,
                                        hint: error.hint,
                                        code: error.code,
                                        achievementId: achievement.id,
                                        userId: userId
                                    });
                                }
                            } catch (error) {
                                console.error('Error in time-based achievement save process:', error);
                            }
                        })();
                    }

                    return unlockedAchievement;
                }

                return achievement;
            });

            if (newlyUnlockedAchievements.length > 0) {
                // Filtrer les achievements déjà notifiés
                const achievementsToNotify = newlyUnlockedAchievements.filter(
                    achievement => !notifiedAchievements.includes(achievement.id)
                );

                if (achievementsToNotify.length > 0) {
                    setNewlyUnlocked(prev => [...prev, ...achievementsToNotify]);
                    // Marquer ces achievements comme notifiés
                    setNotifiedAchievements(prev => [
                        ...prev,
                        ...achievementsToNotify.map(a => a.id)
                    ]);
                }
            }

            return hasChanges ? updated : prevAchievements;
        });
    }, [getUserId, setCurrentAchievements, session, ensureSupabaseSession, notifiedAchievements, setNotifiedAchievements]);

    const clearNewlyUnlocked = useCallback(() => {
        setNewlyUnlocked([]);
    }, []);

    const unlockedAchievements = currentAchievements.filter((a: Achievement) => a.unlockedAt);
    const lockedAchievements = currentAchievements.filter((a: Achievement) => !a.unlockedAt);

    return {
        achievements: currentAchievements,
        unlockedAchievements,
        lockedAchievements,
        newlyUnlocked,
        checkAchievements,
        checkTimeBasedAchievements,
        clearNewlyUnlocked,
    };
}