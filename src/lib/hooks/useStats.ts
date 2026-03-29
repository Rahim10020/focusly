/**
 * @fileoverview Refactored Statistics Hook
 * Consolidates useStats, useStatsStorage, and useStatsActions into a single hook.
 * Uses domain services for all business logic calculations.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Stats, PomodoroSession } from "@/types";
import { StorageService } from "@/lib/domain/services/StorageService";
import { StatsService, StreakData } from "@/lib/domain/services/StatsService";
import { supabaseClient } from "@/lib/supabase/client";
import {
  mapSessionToDbInsert,
  mapDbSessionToSession,
} from "@/lib/supabase/mappers";
import { retryWithBackoff } from "@/lib/utils/retry";
import { useAppToast } from "./useAppToast";

interface UseStatsReturn {
  // State
  stats: Stats;
  sessions: PomodoroSession[];
  loading: boolean;
  error: string | null;

  // Actions
  addSession: (session: PomodoroSession) => Promise<void>;
  refreshStats: () => Promise<void>;

  // Computed values (memoized)
  todaySessions: PomodoroSession[];
  todayFocusTime: number;
  streak: StreakData;
  averageSessionDuration: number;

  // Backward compatibility methods
  updateTaskStats: (totalTasks: number, completedTasks: number) => void;
  getTodaySessions: () => PomodoroSession[];
  getTodayFocusTime: () => number;
}

/**
 * Unified Stats Hook
 * Manages all statistics with localStorage fallback and Supabase sync
 */
export function useStats(): UseStatsReturn {
  const { data: session } = useSession();
  const { actionError } = useAppToast();

  // State
  const [stats, setStats] = useState<Stats>(
    () =>
      StorageService.getLocal("STATS") || {
        totalFocusTime: 0,
        totalTasks: 0,
        completedTasks: 0,
        totalSessions: 0,
        streak: 0,
      },
  );

  const [sessions, setSessions] = useState<PomodoroSession[]>(
    () => StorageService.getLocal("SESSIONS") || [],
  );

  const [loading, setLoading] = useState(!session); // Only loading if not authenticated
  const [error, setError] = useState<string | null>(null);

  // Initialize from localStorage on mount
  useEffect(() => {
    const localStats = StorageService.getLocal<Stats>("STATS");
    const localSessions =
      StorageService.getLocal<PomodoroSession[]>("SESSIONS");

    if (localStats) setStats(localStats);
    if (localSessions) setSessions(localSessions);

    // If authenticated, sync from Supabase
    if (session?.user?.id) {
      syncFromSupabase();
    }
  }, [session?.user?.id]);

  // Persist to localStorage on change
  useEffect(() => {
    StorageService.setLocal("STATS", stats);
  }, [stats]);

  useEffect(() => {
    StorageService.setLocal("SESSIONS", sessions);
  }, [sessions]);

  /**
   * Sync data from Supabase (for authenticated users)
   */
  const syncFromSupabase = useCallback(async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch sessions
      const { data: sessionsData, error: sessionsError } =
        await retryWithBackoff(async () => {
          return supabaseClient
            .from("sessions")
            .select("*")
            .eq("user_id", session.user.id)
            .order("created_at", { ascending: false });
        });

      if (sessionsError) throw sessionsError;
      if (sessionsData) {
        const mappedSessions = sessionsData.map((s) =>
          mapDbSessionToSession(s),
        );
        setSessions(mappedSessions);
      }
    } catch (err) {
      console.error("Failed to sync stats from Supabase:", err);
      setError("Failed to sync statistics");
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  /**
   * Add a new session
   */
  const addSession = useCallback(
    async (newSession: PomodoroSession) => {
      // Update local state immediately
      setSessions((prev) => [...prev, newSession]);

      // Update stats
      if (newSession.completed && newSession.type === "work") {
        const totalFocusTime =
          sessions.reduce(
            (sum, s) =>
              s.completed && s.type === "work" ? sum + s.duration : sum,
            0,
          ) + newSession.duration;

        setStats((prev) => ({
          ...prev,
          totalFocusTime,
          totalSessions: prev.totalSessions + 1,
        }));
      }

      // Sync to Supabase if authenticated
      if (session?.user?.id) {
        try {
          const dbData = mapSessionToDbInsert(newSession, session.user.id);
          await retryWithBackoff(async () => {
            return supabaseClient.from("sessions").insert(dbData as any);
          });
        } catch (err) {
          console.error("Failed to save session to Supabase:", err);
          actionError("Failed to save session");
        }
      }
    },
    [session?.user?.id, sessions, actionError],
  );

  /**
   * Refresh stats from Supabase
   */
  const refreshStats = useCallback(async () => {
    await syncFromSupabase();
  }, [syncFromSupabase]);

  // Memoized computed values using services
  const todaySessions = useMemo(
    () => StatsService.getTodaySessions(sessions),
    [sessions],
  );

  const todayFocusTime = useMemo(
    () => StatsService.getTodayFocusTime(sessions),
    [sessions],
  );

  const streak = useMemo(
    () => StatsService.calculateStreak(sessions),
    [sessions],
  );

  const averageSessionDuration = useMemo(
    () => StatsService.getAverageSessionDuration(sessions),
    [sessions],
  );

  /**
   * Update task-based stats (for backward compatibility)
   */
  const updateTaskStats = useCallback(
    (totalTasks: number, completedTasks: number) => {
      setStats((prev) => ({
        ...prev,
        totalTasks,
        completedTasks,
      }));
    },
    [],
  );

  /**
   * Getter function for today's sessions (for backward compatibility)
   */
  const getTodaySessions = useCallback(() => todaySessions, [todaySessions]);

  /**
   * Getter function for today's focus time (for backward compatibility)
   */
  const getTodayFocusTime = useCallback(() => todayFocusTime, [todayFocusTime]);

  return {
    stats,
    sessions,
    loading,
    error,
    addSession,
    refreshStats,
    todaySessions,
    todayFocusTime,
    streak,
    averageSessionDuration,
    updateTaskStats,
    getTodaySessions,
    getTodayFocusTime,
  };
}
