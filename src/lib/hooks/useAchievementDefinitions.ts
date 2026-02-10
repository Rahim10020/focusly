/**
 * @fileoverview Achievement definitions and types.
 * Contains all achievement configurations with targets and metadata.
 */

import { Achievement } from '@/types';

/**
 * Achievement stats input type
 */
export interface AchievementStats {
    totalSessions: number;
    completedTasks: number;
    streak: number;
    todayFocusMinutes: number;
}

/**
 * Achievement definition without runtime properties
 */
export type AchievementDefinition = Omit<Achievement, 'unlockedAt' | 'progress'>;

/**
 * Achievement check result
 */
export interface AchievementCheckResult {
    shouldUnlock: boolean;
    currentProgress: number;
}

/**
 * Predefined achievement definitions with targets and metadata.
 */
export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
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
 * Check achievement progress based on stats
 */
export function checkAchievementProgress(
    achievementId: string,
    stats: AchievementStats
): AchievementCheckResult {
    switch (achievementId) {
        case 'first_task':
            return { shouldUnlock: stats.completedTasks >= 1, currentProgress: stats.completedTasks };
        case 'first_pomodoro':
            return { shouldUnlock: stats.totalSessions >= 1, currentProgress: stats.totalSessions };
        case 'pomodoro_10':
            return { shouldUnlock: stats.totalSessions >= 10, currentProgress: stats.totalSessions };
        case 'pomodoro_50':
            return { shouldUnlock: stats.totalSessions >= 50, currentProgress: stats.totalSessions };
        case 'pomodoro_100':
            return { shouldUnlock: stats.totalSessions >= 100, currentProgress: stats.totalSessions };
        case 'pomodoro_500':
            return { shouldUnlock: stats.totalSessions >= 500, currentProgress: stats.totalSessions };
        case 'tasks_10':
            return { shouldUnlock: stats.completedTasks >= 10, currentProgress: stats.completedTasks };
        case 'tasks_50':
            return { shouldUnlock: stats.completedTasks >= 50, currentProgress: stats.completedTasks };
        case 'tasks_200':
            return { shouldUnlock: stats.completedTasks >= 200, currentProgress: stats.completedTasks };
        case 'streak_3':
            return { shouldUnlock: stats.streak >= 3, currentProgress: stats.streak };
        case 'streak_7':
            return { shouldUnlock: stats.streak >= 7, currentProgress: stats.streak };
        case 'streak_30':
            return { shouldUnlock: stats.streak >= 30, currentProgress: stats.streak };
        case 'streak_100':
            return { shouldUnlock: stats.streak >= 100, currentProgress: stats.streak };
        case 'focus_time_60':
            return { shouldUnlock: stats.todayFocusMinutes >= 60, currentProgress: stats.todayFocusMinutes };
        case 'focus_time_240':
            return { shouldUnlock: stats.todayFocusMinutes >= 240, currentProgress: stats.todayFocusMinutes };
        case 'focus_time_480':
            return { shouldUnlock: stats.todayFocusMinutes >= 480, currentProgress: stats.todayFocusMinutes };
        default:
            return { shouldUnlock: false, currentProgress: 0 };
    }
}

/**
 * Check time-based achievements (early bird, night owl)
 */
export function checkTimeBasedAchievement(
    achievementId: string,
    hour: number
): boolean {
    if (achievementId === 'early_bird') {
        return hour < 9;
    }
    if (achievementId === 'night_owl') {
        return hour >= 22;
    }
    return false;
}

/**
 * Initialize achievement stats from achievements
 */
export function initAchievementStats(achievements?: Achievement[]): AchievementStats {
    if (!achievements) {
        return { totalSessions: 0, completedTasks: 0, streak: 0, todayFocusMinutes: 0 };
    }

    return {
        totalSessions: achievements.find(a => a.id === 'pomodoro_500')?.progress || 0,
        completedTasks: achievements.find(a => a.id === 'tasks_200')?.progress || 0,
        streak: achievements.find(a => a.id === 'streak_100')?.progress || 0,
        todayFocusMinutes: achievements.find(a => a.id === 'focus_time_480')?.progress || 0,
    };
}
