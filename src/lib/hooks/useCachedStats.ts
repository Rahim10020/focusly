/**
 * @fileoverview Custom hook for caching statistics to reduce API calls.
 * @module lib/hooks/useCachedStats
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useStats } from "./useStats";
import type { Stats, PomodoroSession } from "@/types";
import { CacheService } from "@/lib/services/cacheService";
import { TIME_MS } from "@/lib/constants";

const CACHE_DURATION = 30 * TIME_MS.SECOND;
const STATS_CACHE_KEY = "focusly:stats:latest";

/**
 * Hook that caches statistics for a specified duration to reduce API calls.
 * The cache is automatically invalidated after CACHE_DURATION or can be manually invalidated.
 *
 * @returns {Object} Contains cached stats, all stats hook methods, and invalidateCache function
 */
export const useCachedStats = () => {
  const [cachedStats, setCachedStats] = useState<Stats | null>(null);
  const cacheTimestampRef = useRef<number>(0);

  type UseStatsReturn = {
    stats: Stats;
    sessions: PomodoroSession[];
    loading: boolean;
    error: string | null;
    addSession: (session: PomodoroSession) => Promise<void>;
    updateTaskStats: (
      totalTasks: number,
      completedTasks: number,
    ) => Promise<void>;
    getTodaySessions: () => PomodoroSession[];
    getTodayFocusTime: () => number;
    refreshStats: () => Promise<void>;
    calculateStreak: (sessions: PomodoroSession[]) => number;
  };

  const statsResult = useStats() as UseStatsReturn;
  const { stats, ...statsHook } = statsResult;

  useEffect(() => {
    let isMounted = true;

    const loadPersistedCache = async () => {
      const persisted = await CacheService.getWithTTL<Stats>(
        STATS_CACHE_KEY,
        CACHE_DURATION,
      );
      if (!isMounted || !persisted) return;

      setCachedStats(persisted);
      cacheTimestampRef.current = Date.now();
    };

    void loadPersistedCache();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const now = Date.now();

    // Use in-memory cache if still fresh.
    if (cachedStats && now - cacheTimestampRef.current < CACHE_DURATION) {
      return;
    }

    if (!stats) return;

    const tid = window.setTimeout(() => {
      setCachedStats(stats);
      cacheTimestampRef.current = now;
      void CacheService.set(STATS_CACHE_KEY, stats);
    }, 0);

    return () => clearTimeout(tid);
  }, [stats, cachedStats]);

  /**
   * Manually invalidate the cache to force a refresh of statistics
   */
  const invalidateCache = useCallback(() => {
    // Use a ref so invalidation does not trigger a re-render by itself.
    cacheTimestampRef.current = 0;
    setCachedStats(null);
    void CacheService.delete(STATS_CACHE_KEY);
  }, []);

  // Instead of dynamically using `any`, explicitly create typed wrappers for
  // the known mutating functions coming from useStats.
  const { addSession, updateTaskStats, refreshStats } = statsHook;

  const wrappedAddSession = useCallback(
    async (session: PomodoroSession): Promise<void> => {
      invalidateCache();
      await addSession(session);
      invalidateCache();
    },
    [addSession, invalidateCache],
  );

  const wrappedUpdateTaskStats = useCallback(
    async (totalTasks: number, completedTasks: number): Promise<void> => {
      invalidateCache();
      await updateTaskStats(totalTasks, completedTasks);
      invalidateCache();
    },
    [updateTaskStats, invalidateCache],
  );

  const wrappedRefreshStats = useCallback(async (): Promise<void> => {
    invalidateCache();
    await refreshStats();
    invalidateCache();
  }, [refreshStats, invalidateCache]);

  const hookFns = useMemo(
    () =>
      ({
        sessions: statsHook.sessions,
        loading: statsHook.loading,
        error: statsHook.error,
        addSession: wrappedAddSession,
        updateTaskStats: wrappedUpdateTaskStats,
        getTodaySessions: statsHook.getTodaySessions,
        getTodayFocusTime: statsHook.getTodayFocusTime,
        refreshStats: wrappedRefreshStats,
        calculateStreak: statsHook.calculateStreak,
      }) as Omit<UseStatsReturn, "stats">,
    [
      statsHook.sessions,
      statsHook.loading,
      statsHook.error,
      statsHook.getTodaySessions,
      statsHook.getTodayFocusTime,
      statsHook.calculateStreak,
      wrappedAddSession,
      wrappedUpdateTaskStats,
      wrappedRefreshStats,
    ],
  );

  return useMemo(
    () => ({
      stats: cachedStats || stats,
      ...hookFns,
      invalidateCache,
    }),
    [cachedStats, stats, hookFns, invalidateCache],
  );
};
