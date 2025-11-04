import { useLocalStorage } from './useLocalStorage';
import { Achievement } from '@/types';
import { useCallback, useEffect, useState } from 'react';

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
    const [achievements, setAchievements] = useLocalStorage<Achievement[]>(
        'focusly_achievements',
        ACHIEVEMENTS_DEFINITIONS.map(def => ({ ...def, progress: 0 }))
    );

    const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);

    // Check and unlock achievements
    const checkAchievements = useCallback((stats: {
        totalSessions: number;
        completedTasks: number;
        streak: number;
        todayFocusMinutes: number;
    }) => {
        const updated = achievements.map(achievement => {
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
                const unlockedAchievement = {
                    ...achievement,
                    unlockedAt: Date.now(),
                    progress: achievement.target,
                };
                setNewlyUnlocked(prev => [...prev, unlockedAchievement]);
                return unlockedAchievement;
            }

            return {
                ...achievement,
                progress: currentProgress,
            };
        });

        setAchievements(updated);
    }, [achievements]);

    const checkTimeBasedAchievements = useCallback((hour: number) => {
        const updated = achievements.map(achievement => {
            if (achievement.unlockedAt) return achievement;

            if (achievement.id === 'early_bird' && hour < 9) {
                const unlockedAchievement = {
                    ...achievement,
                    unlockedAt: Date.now(),
                    progress: 1,
                };
                setNewlyUnlocked(prev => [...prev, unlockedAchievement]);
                return unlockedAchievement;
            }

            if (achievement.id === 'night_owl' && hour >= 22) {
                const unlockedAchievement = {
                    ...achievement,
                    unlockedAt: Date.now(),
                    progress: 1,
                };
                setNewlyUnlocked(prev => [...prev, unlockedAchievement]);
                return unlockedAchievement;
            }

            return achievement;
        });

        setAchievements(updated);
    }, [achievements]);

    const clearNewlyUnlocked = () => {
        setNewlyUnlocked([]);
    };

    const unlockedAchievements = achievements.filter(a => a.unlockedAt);
    const lockedAchievements = achievements.filter(a => !a.unlockedAt);

    return {
        achievements,
        unlockedAchievements,
        lockedAchievements,
        newlyUnlocked,
        checkAchievements,
        checkTimeBasedAchievements,
        clearNewlyUnlocked,
    };
}