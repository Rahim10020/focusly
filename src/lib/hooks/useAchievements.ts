import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useLocalStorage } from './useLocalStorage';
import { Achievement } from '@/types';
import { supabase } from '@/lib/supabase';

const ACHIEVEMENTS_DEFINITIONS: Omit<Achievement, 'unlockedAt' | 'progress'>[] = [
    {
        id: 'first_task',
        title: 'Getting Started',
        description: 'Complete your first task',
        icon: '🎯',
        target: 1,
    },
    {
        id: 'first_pomodoro',
        title: 'First Focus',
        description: 'Complete your first pomodoro session',
        icon: '🍅',
        target: 1,
    },
    {
        id: 'pomodoro_10',
        title: 'Focused Warrior',
        description: 'Complete 10 pomodoro sessions',
        icon: '⚔️',
        target: 10,
    },
    {
        id: 'pomodoro_50',
        title: 'Focus Master',
        description: 'Complete 50 pomodoro sessions',
        icon: '👑',
        target: 50,
    },
    {
        id: 'pomodoro_100',
        title: 'Centurion',
        description: 'Complete 100 pomodoro sessions',
        icon: '🏆',
        target: 100,
    },
    {
        id: 'tasks_10',
        title: 'Task Crusher',
        description: 'Complete 10 tasks',
        icon: '💪',
        target: 10,
    },
    {
        id: 'tasks_50',
        title: 'Productivity Pro',
        description: 'Complete 50 tasks',
        icon: '🌟',
        target: 50,
    },
    {
        id: 'streak_3',
        title: '3-Day Streak',
        description: 'Work 3 days in a row',
        icon: '🔥',
        target: 3,
    },
    {
        id: 'streak_7',
        title: 'Week Warrior',
        description: 'Work 7 days in a row',
        icon: '⚡',
        target: 7,
    },
    {
        id: 'streak_30',
        title: 'Monthly Master',
        description: 'Work 30 days in a row',
        icon: '💎',
        target: 30,
    },
    {
        id: 'focus_time_60',
        title: 'Hour of Power',
        description: 'Focus for 60 minutes in a day',
        icon: '⏰',
        target: 60,
    },
    {
        id: 'focus_time_240',
        title: 'Deep Work Champion',
        description: 'Focus for 4 hours in a day',
        icon: '🧠',
        target: 240,
    },
    {
        id: 'early_bird',
        title: 'Early Bird',
        description: 'Complete a pomodoro before 9 AM',
        icon: '🌅',
        target: 1,
    },
    {
        id: 'night_owl',
        title: 'Night Owl',
        description: 'Complete a pomodoro after 10 PM',
        icon: '🦉',
        target: 1,
    },
];

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
    const [loading, setLoading] = useState(false);

    const getUserId = () => (session?.user as any)?.id;

    // Load achievements from database when user logs in
    useEffect(() => {
        if (getUserId()) {
            loadAchievementsFromDB();
        } else {
            setDbAchievements(ACHIEVEMENTS_DEFINITIONS.map(def => ({ ...def, progress: 0 })));
        }
    }, [getUserId()]);

    const loadAchievementsFromDB = async () => {
        const userId = getUserId();
        if (!userId) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('achievements')
                .select('*')
                .eq('user_id', userId);

            if (error) throw error;

            // Merge with definitions
            const achievementsWithData = ACHIEVEMENTS_DEFINITIONS.map(def => {
                const dbAchievement = data.find(a => a.achievement_id === def.id);
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

    // Check and unlock achievements
    const checkAchievements = useCallback(async (stats: {
        totalSessions: number;
        completedTasks: number;
        streak: number;
        todayFocusMinutes: number;
    }) => {
        const userId = getUserId();
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
                    case 'tasks_10':
                        currentProgress = stats.completedTasks;
                        shouldUnlock = stats.completedTasks >= 10;
                        break;
                    case 'tasks_50':
                        currentProgress = stats.completedTasks;
                        shouldUnlock = stats.completedTasks >= 50;
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
                    case 'focus_time_60':
                        currentProgress = stats.todayFocusMinutes;
                        shouldUnlock = stats.todayFocusMinutes >= 60;
                        break;
                    case 'focus_time_240':
                        currentProgress = stats.todayFocusMinutes;
                        shouldUnlock = stats.todayFocusMinutes >= 240;
                        break;
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
                        supabase
                            .from('achievements')
                            .insert({
                                user_id: userId,
                                achievement_id: achievement.id,
                                unlocked_at: new Date().toISOString(),
                            })
                            .then(({ error }) => {
                                if (error) console.error('Error saving achievement to DB:', error);
                            });
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
                setTimeout(() => {
                    setNewlyUnlocked(prev => [...prev, ...newlyUnlockedAchievements]);
                }, 0);
            }

            return hasChanges ? updated : prevAchievements;
        });
    }, [getUserId, setCurrentAchievements]);

    const checkTimeBasedAchievements = useCallback(async (hour: number) => {
        const userId = getUserId();
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
                        supabase
                            .from('achievements')
                            .insert({
                                user_id: userId,
                                achievement_id: achievement.id,
                                unlocked_at: new Date().toISOString(),
                            })
                            .then(({ error }) => {
                                if (error) console.error('Error saving time-based achievement to DB:', error);
                            });
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
                        supabase
                            .from('achievements')
                            .insert({
                                user_id: userId,
                                achievement_id: achievement.id,
                                unlocked_at: new Date().toISOString(),
                            })
                            .then(({ error }) => {
                                if (error) console.error('Error saving time-based achievement to DB:', error);
                            });
                    }

                    return unlockedAchievement;
                }

                return achievement;
            });

            if (newlyUnlockedAchievements.length > 0) {
                setTimeout(() => {
                    setNewlyUnlocked(prev => [...prev, ...newlyUnlockedAchievements]);
                }, 0);
            }

            return hasChanges ? updated : prevAchievements;
        });
    }, [getUserId, setCurrentAchievements]);

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