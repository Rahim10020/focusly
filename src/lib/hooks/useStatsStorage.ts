/**
 * @fileoverview Stats storage hook.
 * Handles switching between localStorage and Supabase based on authentication.
 */

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useLocalStorage } from "./useLocalStorage";
import { Stats, PomodoroSession } from "@/types";
import { STORAGE_KEYS } from "@/lib/constants";
import { supabaseClient } from "@/lib/supabase/client";
import { createClient } from "@supabase/supabase-js";
import { retryWithBackoff } from "@/lib/utils/retry";
import { logger } from "@/lib/logger";
import { useToastContext } from "@/components/providers/ToastProvider";

interface UseStatsStorageReturn {
  stats: Stats;
  sessions: PomodoroSession[];
  loading: boolean;
  error: string | null;
  setStats: React.Dispatch<React.SetStateAction<Stats>>;
  setSessions: React.Dispatch<React.SetStateAction<PomodoroSession[]>>;
  loadStats: () => Promise<void>;
  loadSessions: () => Promise<void>;
}

export function useStatsStorage(): UseStatsStorageReturn {
  const { data: session } = useSession();
  const { error: showErrorToast } = useToastContext();

  // Local storage states
  const [localStats, setLocalStats] = useLocalStorage<Stats>(
    STORAGE_KEYS.STATS,
    {
      totalFocusTime: 0,
      totalTasks: 0,
      completedTasks: 0,
      totalSessions: 0,
      streak: 0,
    },
  );

  const [localSessions, setLocalSessions] = useLocalStorage<PomodoroSession[]>(
    STORAGE_KEYS.SESSIONS,
    [],
  );

  // Database states
  const [dbStats, setDbStats] = useState<Stats>({
    totalFocusTime: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalSessions: 0,
    streak: 0,
  });

  const [dbSessions, setDbSessions] = useState<PomodoroSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUserId = useCallback(() => session?.user?.id, [session]);
  const isAuthenticated = !!getUserId();

  const getAuthenticatedSupabaseClient = useCallback(() => {
    if (!session?.accessToken) {
      throw new Error("No access token available");
    }
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        },
      },
    );
  }, [session?.accessToken]);

  // Set auth session when user logs in
  useEffect(() => {
    if (session?.accessToken && session?.refreshToken) {
      supabaseClient.auth.setSession({
        access_token: session.accessToken,
        refresh_token: session.refreshToken,
      });
    }
  }, [session]);

  const loadStats = useCallback(async () => {
    const userId = getUserId();
    if (!userId) return;

    setLoading(true);
    setError(null);
    try {
      const { data, error } = await retryWithBackoff(async () => {
        const authenticatedClient = getAuthenticatedSupabaseClient();
        const result = await authenticatedClient
          .from("stats")
          .select("*")
          .eq("user_id", userId)
          .single();
        if (result.error && result.error.code !== "PGRST116")
          throw result.error;
        return result;
      });

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        const statsData = data as {
          total_focus_time: number;
          total_tasks: number;
          completed_tasks: number;
          total_sessions: number;
          streak: number;
        };
        setDbStats({
          totalFocusTime: statsData.total_focus_time,
          totalTasks: statsData.total_tasks,
          completedTasks: statsData.completed_tasks,
          totalSessions: statsData.total_sessions,
          streak: statsData.streak,
        });
      }
    } catch (err: unknown) {
      const errorMessage =
        (err as Error).message || "Failed to load statistics";
      logger.error("Error loading stats from DB", err as Error, {
        action: "loadStats",
        userId: getUserId(),
      });
      setError(errorMessage);
      showErrorToast("Failed to Load Statistics", errorMessage);
    } finally {
      setLoading(false);
    }
  }, [getUserId, getAuthenticatedSupabaseClient, showErrorToast]);

  const loadSessions = useCallback(async () => {
    const userId = getUserId();
    if (!userId) return;

    try {
      const { data, error } = await retryWithBackoff(async () => {
        const authenticatedClient = getAuthenticatedSupabaseClient();
        const result = await authenticatedClient
          .from("sessions")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (result.error) throw result.error;
        return result;
      });

      if (error) throw error;

      const formattedSessions: PomodoroSession[] = (
        data as Array<{
          id: string;
          type: string;
          duration: number;
          completed: boolean;
          task_id: string;
          created_at: string;
        }>
      ).map((dbSession) => ({
        id: dbSession.id,
        type: dbSession.type as "work" | "break",
        duration: dbSession.duration,
        completed: dbSession.completed,
        taskId: dbSession.task_id,
        startedAt: new Date(dbSession.created_at).getTime(),
        completedAt: dbSession.completed
          ? new Date(dbSession.created_at).getTime() + dbSession.duration * 1000
          : undefined,
      }));

      setDbSessions(formattedSessions);
    } catch (err) {
      logger.error("Error loading sessions from DB", err as Error, {
        action: "loadSessions",
        userId: getUserId(),
      });
    }
  }, [getUserId, getAuthenticatedSupabaseClient]);

  // Load data when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      loadStats();
      loadSessions();
    } else {
      setDbStats({
        totalFocusTime: 0,
        totalTasks: 0,
        completedTasks: 0,
        totalSessions: 0,
        streak: 0,
      });
      setDbSessions([]);
    }
  }, [isAuthenticated, loadStats, loadSessions]);

  return {
    stats: isAuthenticated ? dbStats : localStats,
    sessions: isAuthenticated ? dbSessions : localSessions,
    loading,
    error,
    setStats: isAuthenticated ? setDbStats : setLocalStats,
    setSessions: isAuthenticated ? setDbSessions : setLocalSessions,
    loadStats,
    loadSessions,
  };
}
