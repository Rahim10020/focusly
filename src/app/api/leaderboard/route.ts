/**
 * @fileoverview Refactored Leaderboard API route for fetching user rankings.
 */

import {
  compose,
  withRateLimit,
  withLogging,
  withErrorHandling,
  withQueryValidation,
} from "@/lib/api/middleware";
import { LeaderboardQuerySchema } from "@/lib/api/schemas";
import { successResponse } from "@/lib/api/utils/response";
import { getAdminSupabaseClient } from "@/lib/api/supabase";
import {
  getPaginationOffset,
  buildPaginationMeta,
} from "@/lib/api/utils/pagination";
import { LEADERBOARD_DEFAULTS } from "@/constants";
import { Cache } from "@/lib/cache";
import { logger } from "@/lib/logger";

type LeaderboardTimeFilter = "all" | "week" | "month";

/**
 * Get start date for time-based filtering
 */
function getFilterStartDate(timeFilter: LeaderboardTimeFilter): string | null {
  if (timeFilter === "all") return null;

  const now = new Date();

  if (timeFilter === "week") {
    const start = new Date(now);
    const day = start.getDay();
    const diffToMonday = (day + 6) % 7;
    start.setDate(start.getDate() - diffToMonday);
    start.setHours(0, 0, 0, 0);
    return start.toISOString();
  }

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);
  return startOfMonth.toISOString();
}

/**
 * Calcule le streak à partir des sessions et tâches complétées pour une période donnée
 * Compte le nombre de jours consécutifs depuis le dernier jour de la période
 */
function calculateStreakFromActivities(
  sessions: any[],
  tasks: any[],
  filterStartDate: string | null,
): number {
  if (!filterStartDate) return 0; // Pas de calcul pour "All Time"

  // Extraire les dates uniques où l'utilisateur a eu de l'activité
  const activeDates = new Set<string>();

  // Ajouter les dates des sessions complétées
  sessions.forEach((session) => {
    if (session.completed_at) {
      const date = new Date(session.completed_at);
      activeDates.add(date.toISOString().split("T")[0]); // YYYY-MM-DD
    }
  });

  // Ajouter les dates des tâches complétées
  tasks.forEach((task) => {
    if (task.completed_at) {
      const date = new Date(task.completed_at);
      activeDates.add(date.toISOString().split("T")[0]); // YYYY-MM-DD
    }
  });

  if (activeDates.size === 0) return 0;

  // Trier les dates
  const sortedDates = Array.from(activeDates).sort();

  // Compter les jours consécutifs depuis aujourd'hui en remontant
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  let streak = 0;
  let currentDate = new Date(today);

  // Chercher à partir d'aujourd'hui et remonter
  while (true) {
    const dateStr = currentDate.toISOString().split("T")[0];
    if (activeDates.has(dateStr)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Fetch leaderboard with optimized query pattern
 * Combines stats, profiles, and sessions in single request when possible
 */
async function getHandler(
  _request: any,
  _context: unknown,
  validatedData: unknown,
) {
  const parsedData = LeaderboardQuerySchema.parse(validatedData);
  const { page, limit, timeFilter } = parsedData;

  // Ensure pagination doesn't exceed limits
  if (page * limit > LEADERBOARD_DEFAULTS.MAX_OFFSET) {
    throw new Error("Pagination offset too large");
  }

  const offset = getPaginationOffset({ page, limit });
  const cacheKey = `leaderboard:${page}:${limit}:${timeFilter}`;

  const result = await Cache.getOrSet(
    cacheKey,
    async () => {
      const supabase = getAdminSupabaseClient();
      const filterStartDate = getFilterStartDate(
        timeFilter as LeaderboardTimeFilter,
      );

      try {
        if (timeFilter === "all") {
          // Simple path: use precomputed stats
          // Query 1: Get stats with count
          const {
            data: stats,
            error: statsErr,
            count,
          } = await supabase
            .from("stats")
            .select(
              `
              user_id,
              total_sessions,
              completed_tasks,
              total_tasks,
              streak,
              total_focus_time,
              longest_streak
            `,
              { count: "exact" },
            )
            .order("total_focus_time", { ascending: false })
            .range(offset, offset + limit - 1);

          if (statsErr || !stats) {
            logger.error(
              "Error fetching leaderboard stats",
              statsErr as Error,
              {
                action: "leaderboardStats",
              },
            );
            throw new Error("Failed to fetch leaderboard");
          }

          // Query 2: Get profiles for these stats
          const userIds = stats.map((s) => (s as any).user_id);
          const { data: profiles, error: profilesErr } = await supabase
            .from("profiles")
            .select("id, username, avatar_url")
            .in("id", userIds);

          if (profilesErr) {
            logger.error(
              "Error fetching leaderboard profiles",
              profilesErr as Error,
              {
                action: "leaderboardProfiles",
              },
            );
            throw new Error("Failed to fetch profiles");
          }

          // Create profile map for efficient lookup
          const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

          // Format response
          const leaderboardData = (stats || []).map((stat) => {
            const userIdStr = (stat as any).user_id;
            const profile = profileMap.get(userIdStr);
            return {
              id: userIdStr,
              username: profile?.username || "Anonymous",
              avatar_url: profile?.avatar_url || null,
              stats: {
                total_sessions: (stat as any).total_sessions,
                completed_tasks: (stat as any).completed_tasks,
                total_tasks: (stat as any).total_tasks,
                streak: (stat as any).streak,
                total_focus_time: (stat as any).total_focus_time,
                longest_streak: (stat as any).longest_streak,
              },
            };
          });

          return {
            data: leaderboardData,
            pagination: buildPaginationMeta({ page, limit }, count || 0),
          };
        } else {
          // Filtered path: week/month
          // Query 1: Get filtered sessions and tasks
          const { data: userIds, error: userIdsErr } = await supabase
            .from("stats")
            .select("user_id")
            .order("total_focus_time", { ascending: false })
            .range(offset, offset + limit - 1);

          if (userIdsErr || !userIds) {
            throw new Error("Failed to fetch user list");
          }

          const ids = userIds.map((s) => (s as any).user_id);

          // Query 2 + 3: Get filtered sessions, tasks, and profiles combined
          const [
            { data: filteredSessions, error: sessionsErr },
            { data: tasks, error: tasksErr },
            { data: profiles, error: profilesErr },
          ] = await Promise.all([
            supabase
              .from("sessions")
              .select("user_id, duration, type, completed, completed_at")
              .in("user_id", ids)
              .eq("completed", true)
              .eq("type", "work")
              .gte("completed_at", filterStartDate!),
            supabase
              .from("tasks")
              .select("user_id, completed, completed_at")
              .in("user_id", ids)
              .gte("completed_at", filterStartDate!),
            supabase
              .from("profiles")
              .select("id, username, avatar_url")
              .in("id", ids),
          ]);

          if (sessionsErr || tasksErr || profilesErr) {
            throw new Error("Failed to fetch filtered data");
          }

          // Calculate stats using domain service
          const statsMap = new Map();
          ids.forEach((id) => {
            const userSessions = (filteredSessions || []).filter(
              (s) => (s as any).user_id === id,
            );
            const userTasks = (tasks || []).filter(
              (t) => (t as any).user_id === id && (t as any).completed,
            );
            const totalFocusTime = userSessions.reduce(
              (sum, s) => sum + ((s as any).duration || 0),
              0,
            );

            // Calculer le streak basé sur l'activité pendant la période filtrée
            const streak = calculateStreakFromActivities(
              userSessions,
              userTasks,
              filterStartDate,
            );

            statsMap.set(id, {
              total_sessions: userSessions.length,
              completed_tasks: userTasks.length,
              total_focus_time: totalFocusTime,
              streak,
            });
          });

          // Format response
          const profilesMap = new Map((profiles || []).map((p) => [p.id, p]));

          const leaderboardData = ids.map((id) => {
            const profile = profilesMap.get(id);
            const stats = statsMap.get(id) || {};

            return {
              id,
              username: profile?.username || "Anonymous",
              avatar_url: profile?.avatar_url || null,
              stats,
            };
          });

          return {
            data: leaderboardData,
            pagination: buildPaginationMeta({ page, limit }, ids.length),
          };
        }
      } catch (error) {
        logger.error("Failed to fetch leaderboard", error as Error, {
          timeFilter,
          page,
          limit,
        });
        throw error;
      }
    },
    {
      ttl: 10 * 60 * 1000, // 10 minutes
    },
  );

  return successResponse(result.data, { pagination: result.pagination });
}

export const GET = compose(
  withErrorHandling(),
  withLogging(),
  withQueryValidation(LeaderboardQuerySchema),
  withRateLimit("generous"),
)(getHandler);
