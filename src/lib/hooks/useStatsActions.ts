/**
 * @fileoverview Stats actions hook.
 * Handles adding sessions and updating task stats.
 */

import { useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Stats, PomodoroSession } from '@/types';
import { createClient } from '@supabase/supabase-js';
import { retryWithBackoff } from '@/lib/utils/retry';
import { logger } from '@/lib/logger';

interface UseStatsActionsReturn {
  addSession: (session: PomodoroSession) => Promise<void>;
  updateTaskStats: (totalTasks: number, completedTasks: number) => Promise<void>;
  refreshStats: () => Promise<void>;
}

interface UseStatsActionsProps {
  setStats: React.Dispatch<React.SetStateAction<Stats>>;
  setSessions: React.Dispatch<React.SetStateAction<PomodoroSession[]>>;
  loadStats: () => Promise<void>;
  loadSessions: () => Promise<void>;
}

export function useStatsActions({
  setStats,
  setSessions,
  loadStats,
  loadSessions,
}: UseStatsActionsProps): UseStatsActionsReturn {
  const { data: session } = useSession();

  const getUserId = useCallback(() => session?.user?.id, [session]);

  const getAuthenticatedSupabaseClient = useCallback(() => {
    if (!session?.accessToken) {
      throw new Error('No access token available');
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
      }
    );
  }, [session]);

  const addSession = useCallback(async (newSession: PomodoroSession) => {
    const userId = getUserId();

    if (userId) {
      // Save to database
      try {
        await retryWithBackoff(async () => {
          const authenticatedClient = getAuthenticatedSupabaseClient();
          const result = await (authenticatedClient
            .from('sessions') as unknown as {
              insert: (data: object) => Promise<{ error: Error | null }>;
            })
            .insert({
              user_id: userId,
              task_id: newSession.taskId,
              duration: newSession.duration,
              type: newSession.type,
              completed: newSession.completed,
              created_at: new Date(newSession.startedAt).toISOString(),
            });
          if ((result as { error: Error | null }).error) {
            throw (result as { error: Error | null }).error;
          }
        });

        // Update stats in database
        if (newSession.completed && newSession.type === 'work') {
          await retryWithBackoff(async () => {
            const authenticatedClient = getAuthenticatedSupabaseClient();

            const { data: existingStats } = await authenticatedClient
              .from('stats')
              .select('*')
              .eq('user_id', userId)
              .single();

            if (existingStats) {
              const result = await authenticatedClient
                .from('stats')
                .update({
                  total_focus_time: (existingStats as { total_focus_time: number }).total_focus_time +
                    Math.floor(newSession.duration / 60),
                  total_sessions: (existingStats as { total_sessions: number }).total_sessions + 1,
                })
                .eq('user_id', userId);
              if (result.error) throw result.error;
            } else {
              const result = await authenticatedClient
                .from('stats')
                .insert({
                  user_id: userId,
                  total_focus_time: Math.floor(newSession.duration / 60),
                  total_sessions: 1,
                  total_tasks: 0,
                  completed_tasks: 0,
                  streak: 0,
                });
              if (result.error) throw result.error;
            }
          });
        }

        setSessions((prev) => [...prev, newSession]);

        if (newSession.completed && newSession.type === 'work') {
          setStats((prev) => ({
            ...prev,
            totalFocusTime: prev.totalFocusTime + Math.floor(newSession.duration / 60),
            totalSessions: prev.totalSessions + 1,
          }));
        }
      } catch (err) {
        logger.error('Error adding session to DB', err as Error, {
          action: 'addSession',
          userId: getUserId(),
        });
      }
    } else {
      // Save to local state
      setSessions((prev) => [...prev, newSession]);

      if (newSession.completed && newSession.type === 'work') {
        setStats((prev) => ({
          ...prev,
          totalFocusTime: prev.totalFocusTime + Math.floor(newSession.duration / 60),
          totalSessions: prev.totalSessions + 1,
        }));
      }
    }
  }, [getUserId, getAuthenticatedSupabaseClient, setSessions, setStats]);

  const updateTaskStats = useCallback(async (totalTasks: number, completedTasks: number) => {
    const userId = getUserId();

    if (userId) {
      try {
        await retryWithBackoff(async () => {
          const authenticatedClient = getAuthenticatedSupabaseClient();

          const { data: existingStats } = await authenticatedClient
            .from('stats')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (existingStats) {
            const result = await authenticatedClient
              .from('stats')
              .update({
                total_tasks: totalTasks,
                completed_tasks: completedTasks,
              })
              .eq('user_id', userId);
            if (result.error) throw result.error;
          } else {
            const result = await authenticatedClient
              .from('stats')
              .insert({
                user_id: userId,
                total_tasks: totalTasks,
                completed_tasks: completedTasks,
                total_focus_time: 0,
                total_sessions: 0,
                streak: 0,
              });
            if (result.error) throw result.error;
          }
        });

        setStats((prev) => {
          if (prev.totalTasks === totalTasks && prev.completedTasks === completedTasks) {
            return prev;
          }
          return {
            ...prev,
            totalTasks,
            completedTasks,
          };
        });

        await loadStats();
      } catch (err) {
        logger.error('Error updating task stats in DB', err as Error, {
          action: 'updateTaskStats',
          userId: getUserId(),
        });
      }
    } else {
      setStats((prev) => {
        if (prev.totalTasks === totalTasks && prev.completedTasks === completedTasks) {
          return prev;
        }
        return {
          ...prev,
          totalTasks,
          completedTasks,
        };
      });
    }
  }, [getUserId, getAuthenticatedSupabaseClient, setStats, loadStats]);

  const refreshStats = useCallback(async () => {
    const userId = getUserId();
    if (userId) {
      await loadStats();
      await loadSessions();
    }
  }, [getUserId, loadStats, loadSessions]);

  return {
    addSession,
    updateTaskStats,
    refreshStats,
  };
}
