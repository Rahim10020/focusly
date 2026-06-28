/**
 * @fileoverview Refactored Achievements Hook
 * Consolidates useAchievements, useAchievementStorage, useAchievementActions, and useAchievementDefinitions into a single hook.
 */

import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import { useSession } from '@/hooks/useAuth';
import { Achievement } from '@/types';
import { retryWithBackoff } from '@/lib/utils/retry';
import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS } from '@/constants';

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
function checkAchievementProgress(
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
function checkTimeBasedAchievement(
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
function initAchievementStats(achievements?: Achievement[]): AchievementStats {
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

/**
 * Return type for unified achievements hook
 */
export interface UseAchievementsReturn {
  achievements: Achievement[];
  notifiedAchievements: string[];
  stats: AchievementStats;
  isLoaded: boolean;
  checkAchievements: (stats: AchievementStats) => void;
  checkTimeBasedAchievements: (hour: number) => void;
  resetAchievements: () => Promise<void>;
  resetAchievement: (id: string) => Promise<void>;
  newlyUnlocked: Achievement[];
  clearNewlyUnlocked: () => void;
  unlockedAchievements: Achievement[];
  lockedAchievements: Achievement[];
}

/**
 * Unified Achievements Hook
 * Consolidates useAchievements, useAchievementStorage, useAchievementActions, and definitions
 * Manages all achievement-related logic in a single hook.
 */
export function useAchievements(): UseAchievementsReturn {
  const { data: session } = useSession();

  // Storage: Handle both local and Supabase
  const [localAchievements, setLocalAchievements] = useLocalStorage<Achievement[]>(
    STORAGE_KEYS.ACHIEVEMENTS,
    ACHIEVEMENT_DEFINITIONS.map((def) => ({ ...def, progress: 0 })),
  );
  const [dbAchievements, setDbAchievements] = useState<Achievement[]>(
    ACHIEVEMENT_DEFINITIONS.map((def) => ({ ...def, progress: 0 })),
  );
  const [loading, setLoading] = useState(false);

  // State
  const [notifiedAchievements, setNotifiedAchievements] = useState<string[]>([]);
  const [stats, setStats] = useState<AchievementStats>(initAchievementStats());
  const [isLoaded, setIsLoaded] = useState(false);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);

  const userId = session?.user?.id;
  const isAuthenticated = !!userId;
  const achievements = isAuthenticated ? dbAchievements : localAchievements;
  const setAchievements = isAuthenticated ? setDbAchievements : setLocalAchievements;

  /**
   * Load achievements from Supabase (if authenticated)
   */
  const loadAchievements = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const { data, error } = await retryWithBackoff(async () => {
        return supabaseClient
          .from('achievements')
          .select('*')
          .eq('user_id', userId);
      });

      if (error) throw error;
      if (data) {
        const achievementData = data as {
          achievement_id: string;
          unlocked_at: string;
        }[];

        const formattedAchievements = ACHIEVEMENT_DEFINITIONS.map((def) => {
          const dbAchievement = achievementData.find(
            (a) => a.achievement_id === def.id,
          );
          return {
            ...def,
            progress: 0,
            unlockedAt: dbAchievement
              ? new Date(dbAchievement.unlocked_at).getTime()
              : undefined,
          };
        });

        setDbAchievements(formattedAchievements);
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Initialize achievements on mount and load from Supabase
   */
  useEffect(() => {
    const initData = async () => {
      await loadAchievements();
      const stored = localStorage.getItem(STORAGE_KEYS.NOTIFIED_ACHIEVEMENTS);
      setNotifiedAchievements(stored ? JSON.parse(stored) : []);
      setIsLoaded(true);
    };
    initData();
  }, [session, loadAchievements]);

  /**
   * Update stats when achievements change
   */
  useEffect(() => {
    setStats(initAchievementStats(achievements));
  }, [achievements]);

  /**
   * Persist notified achievements to localStorage
   */
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.NOTIFIED_ACHIEVEMENTS,
      JSON.stringify(notifiedAchievements),
    );
  }, [notifiedAchievements]);

  /**
   * Save achievement to Supabase
   */
  const saveAchievementToDB = useCallback(async (achievementId: string) => {
    if (!userId) return;

    try {
      await retryWithBackoff(async () => {
        return supabaseClient
          .from('achievements')
          .upsert(
            {
              user_id: userId,
              achievement_id: achievementId,
              unlocked_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,achievement_id' }
          );
      });
    } catch (error) {
      console.error('Error saving achievement to DB:', error);
    }
  }, [userId]);

  /**
   * Check and unlock achievements based on stats
   */
  const checkAchievements = useCallback(
    (statsToCheck: AchievementStats) => {
      setAchievements((prevAchievements) => {
        const newlyUnlockedList: Achievement[] = [];

        const updated = prevAchievements.map((achievement) => {
          if (achievement.unlockedAt) return achievement;

          const { shouldUnlock, currentProgress } = checkAchievementProgress(
            achievement.id,
            statsToCheck
          );

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
            (a) => !notifiedAchievements.includes(a.id)
          );
          if (toNotify.length > 0) {
            setNewlyUnlocked((prev) => [...prev, ...toNotify]);
            setNotifiedAchievements((prev) => [...prev, ...toNotify.map((a) => a.id)]);
          }
        }

        return updated;
      });
    },
    [notifiedAchievements, saveAchievementToDB, setAchievements]
  );

  /**
   * Check time-based achievements
   */
  const checkTimeBasedAchievements = useCallback(
    (hour: number) => {
      setAchievements((prevAchievements) => {
        const newlyUnlockedList: Achievement[] = [];

        const updated = prevAchievements.map((achievement) => {
          if (achievement.unlockedAt) return achievement;

          if (
            checkTimeBasedAchievement(achievement.id, hour) &&
            !notifiedAchievements.includes(achievement.id)
          ) {
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
            (a) => !notifiedAchievements.includes(a.id)
          );
          if (toNotify.length > 0) {
            setNewlyUnlocked((prev) => [...prev, ...toNotify]);
            setNotifiedAchievements((prev) => [...prev, ...toNotify.map((a) => a.id)]);
          }
        }

        return updated;
      });
    },
    [notifiedAchievements, saveAchievementToDB, setAchievements]
  );

  /**
   * Reset all achievements
   */
  const resetAchievements = useCallback(async () => {
    const reset: Achievement[] = ACHIEVEMENT_DEFINITIONS.map((def) => ({
      ...def,
      unlockedAt: undefined,
      progress: 0,
    }));
    setAchievements(reset);
    setNotifiedAchievements([]);
    setStats(initAchievementStats());
  }, [setAchievements]);

  /**
   * Reset specific achievement
   */
  const resetAchievement = useCallback(
    async (id: string) => {
      setAchievements((prev: Achievement[]) =>
        prev.map((a) =>
          a.id === id ? { ...a, unlockedAt: undefined, progress: 0 } : a,
        ),
      );
    },
    [setAchievements],
  );

  /**
   * Clear newly unlocked achievements
   */
  const clearNewlyUnlocked = useCallback(() => {
    setNewlyUnlocked([]);
  }, []);

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
    unlockedAchievements: achievements.filter((a) => a.unlockedAt),
    lockedAchievements: achievements.filter((a) => !a.unlockedAt),
  };
}
