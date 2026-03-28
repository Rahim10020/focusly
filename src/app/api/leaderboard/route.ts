/**
 * @fileoverview Leaderboard API route for fetching user rankings.
 *
 * Provides a paginated endpoint to retrieve user statistics ranked by
 * total focus time. Results are cached for 10 minutes to improve performance.
 *
 * Route: /api/leaderboard
 */

import { NextRequest } from "next/server";
import { supabaseServerPool, type Database } from "@/lib/supabase";
import {
  compose,
  withRateLimit,
  withLogging,
  withErrorHandling,
  withQueryValidation,
  LeaderboardQuerySchema,
  successResponse,
  getPaginationOffset,
  buildPaginationMeta,
} from "@/lib/api";
import { Cache } from "@/lib/cache";
import { logger } from "@/lib/logger";
import { LEADERBOARD_DEFAULTS } from "@/lib/constants";
import {
  StreakService,
  type Session as StreakSession,
} from "@/lib/services/streakService";

/**
 * Leaderboard entry containing user profile and statistics.
 * @typedef {Object} LeaderboardEntry
 * @property {string} id - User ID
 * @property {string} username - User's display name
 * @property {string|null} avatar_url - User's avatar URL
 * @property {Object} stats - User's statistics
 * @property {number} stats.total_sessions - Total number of focus sessions
 * @property {number} stats.completed_tasks - Number of completed tasks
 * @property {number} stats.total_tasks - Total number of tasks
 * @property {number} stats.streak - Current streak count
 * @property {number} stats.total_focus_time - Total focus time in minutes
 * @property {number} stats.longest_streak - Longest streak achieved
 */

/**
 * Paginated leaderboard response.
 * @typedef {Object} LeaderboardResponse
 * @property {LeaderboardEntry[]} data - Array of leaderboard entries
 * @property {Object} pagination - Pagination metadata
 * @property {number} pagination.page - Current page number
 * @property {number} pagination.limit - Items per page
 * @property {number} pagination.total - Total number of entries
 * @property {number} pagination.totalPages - Total number of pages
 */

type LeaderboardTimeFilter = "all" | "week" | "month";

function getFilterStartDate(timeFilter: LeaderboardTimeFilter): string | null {
  const now = new Date();

  if (timeFilter === "all") return null;

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

async function getHandler(
  _request: NextRequest,
  _context: unknown,
  validatedData: unknown,
) {
  const parsedData = LeaderboardQuerySchema.parse(validatedData);
  const { page, limit, timeFilter } = parsedData;

  // S'assurer que page * limit ne dépasse pas un seuil
  if (page * limit > LEADERBOARD_DEFAULTS.MAX_OFFSET) {
    throw new Error("Pagination offset too large");
  }

  const offset = getPaginationOffset({ page, limit });

  const cacheKey = `leaderboard:${page}:${limit}:${timeFilter}`;

  const result = await Cache.getOrSet(
    cacheKey,
    async () => {
      // Use pooled server admin client for better performance
      const supabaseAdmin = supabaseServerPool.getAdminClient();

      // 1. Get total count
      const { count: totalCount, error: countError } = await supabaseAdmin
        .from("stats")
        .select("*", { count: "exact", head: true });

      if (countError) {
        logger.error("Error fetching count", countError as Error, {
          action: "leaderboardGetCount",
        });
        throw new Error("Failed to fetch leaderboard count");
      }

      // 2. Fetch stats with pagination
      const { data: statsData, error: statsError } = await supabaseAdmin
        .from("stats")
        .select(
          "user_id, total_sessions, completed_tasks, total_tasks, streak, total_focus_time, longest_streak",
        )
        .order("total_focus_time", { ascending: false })
        .range(offset, offset + limit - 1);

      if (statsError) {
        logger.error("Error fetching stats", statsError as Error, {
          action: "leaderboardGetStats",
        });
        throw new Error("Failed to fetch leaderboard stats");
      }

      if (!statsData || statsData.length === 0) {
        return {
          data: [],
          pagination: buildPaginationMeta({ page, limit }, totalCount || 0),
        };
      }

      const typedStatsData =
        statsData as Database["public"]["Tables"]["stats"]["Row"][];

      // Get all user IDs from stats
      const userIds = typedStatsData.map((stat) => stat.user_id);

      // 3. Fetch profiles
      const { data: profilesData, error: profilesError } = await supabaseAdmin
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      if (profilesError) {
        logger.error("Error fetching profiles", profilesError as Error, {
          action: "leaderboardGetProfiles",
        });
        // Continue even if profiles fetch fails, we'll use defaults
      }

      const typedProfilesData = (profilesData ||
        []) as Database["public"]["Tables"]["profiles"]["Row"][];

      // Apply time filtering to leaderboard metrics when needed.
      // `all` uses precomputed aggregate stats table for best performance.
      const filteredStatsByUser = new Map<
        string,
        {
          total_sessions: number;
          completed_tasks: number;
          total_tasks: number;
          streak: number;
          total_focus_time: number;
          longest_streak: number;
        }
      >();

      if (timeFilter !== "all") {
        const filterStartIso = getFilterStartDate(
          timeFilter as LeaderboardTimeFilter,
        );
        if (!filterStartIso) {
          throw new Error("Invalid leaderboard filter date range");
        }

        const { data: filteredSessions, error: filteredSessionsError } =
          await supabaseAdmin
            .from("sessions")
            .select("user_id, duration, completed_at, type, completed")
            .in("user_id", userIds)
            .eq("completed", true)
            .eq("type", "work")
            .gte("completed_at", filterStartIso);

        if (filteredSessionsError) {
          logger.error(
            "Error fetching filtered sessions",
            filteredSessionsError as Error,
            {
              action: "leaderboardFilteredSessions",
              timeFilter,
            },
          );
          throw new Error("Failed to fetch filtered sessions");
        }

        const typedFilteredSessions = (filteredSessions ||
          []) as Database["public"]["Tables"]["sessions"]["Row"][];

        const { data: userTasks, error: userTasksError } = await supabaseAdmin
          .from("tasks")
          .select("user_id, completed, completed_at, created_at")
          .in("user_id", userIds);

        if (userTasksError) {
          logger.error(
            "Error fetching filtered tasks",
            userTasksError as Error,
            {
              action: "leaderboardFilteredTasks",
              timeFilter,
            },
          );
          throw new Error("Failed to fetch filtered tasks");
        }

        const typedUserTasks = (userTasks || []) as Pick<
          Database["public"]["Tables"]["tasks"]["Row"],
          "user_id" | "completed" | "completed_at" | "created_at"
        >[];

        const streakSessionsByUser = new Map<string, StreakSession[]>();

        userIds.forEach((id) => {
          filteredStatsByUser.set(id, {
            total_sessions: 0,
            completed_tasks: 0,
            total_tasks: 0,
            streak: 0,
            total_focus_time: 0,
            longest_streak: 0,
          });
          streakSessionsByUser.set(id, []);
        });

        typedFilteredSessions.forEach((session) => {
          const stats = filteredStatsByUser.get(session.user_id);
          if (!stats || !session.completed_at) return;

          stats.total_sessions += 1;
          stats.total_focus_time += session.duration || 0;

          streakSessionsByUser.get(session.user_id)?.push({
            id: session.id,
            user_id: session.user_id,
            completed_at: session.completed_at,
            duration: session.duration || 0,
            type: session.type || "work",
            completed: session.completed ?? undefined,
          });
        });

        typedUserTasks.forEach((task) => {
          const stats = filteredStatsByUser.get(task.user_id);
          if (!stats) return;

          if (task.created_at && task.created_at >= filterStartIso) {
            stats.total_tasks += 1;
          }

          if (
            task.completed &&
            task.completed_at &&
            task.completed_at >= filterStartIso
          ) {
            stats.completed_tasks += 1;
          }
        });

        streakSessionsByUser.forEach((sessions, userId) => {
          const stats = filteredStatsByUser.get(userId);
          if (!stats || sessions.length === 0) return;

          const streakData = StreakService.calculateStreak(sessions);
          stats.streak = streakData.current;
          stats.longest_streak = streakData.longest;
        });
      }

      // 4. Create missing profiles (using admin client)
      const usersWithStats = new Set(
        typedStatsData.map((stat) => stat.user_id),
      );
      const usersWithProfiles = new Set(
        typedProfilesData.map((profile) => profile.id),
      );
      const usersWithoutProfiles = Array.from(usersWithStats).filter(
        (id) => !usersWithProfiles.has(id),
      );

      if (usersWithoutProfiles.length > 0) {
        const profilesToCreate = usersWithoutProfiles.map((id) => ({
          id,
          username: null,
          avatar_url: null,
        }));

        // Check existing profiles to avoid conflicts
        const { data: existingProfiles } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .in(
            "id",
            profilesToCreate.map((p: { id: string }) => p.id),
          );

        const existingIds = new Set(
          existingProfiles?.map((p: { id: string }) => p.id) || [],
        );
        const profilesToInsert = profilesToCreate.filter(
          (p: { id: string }) => !existingIds.has(p.id),
        );

        if (profilesToInsert.length > 0) {
          const { error: createError } = await supabaseAdmin
            .from("profiles")
            .insert(profilesToInsert);

          if (createError) {
            logger.error(
              "Error creating missing profiles",
              createError as Error,
              {
                action: "createMissingProfiles",
                userIds: usersWithoutProfiles,
              },
            );
            // Continue without profiles for these users
          } else {
            // Add created profiles to the array
            profilesToInsert.forEach((profile) => {
              typedProfilesData.push(
                profile as Database["public"]["Tables"]["profiles"]["Row"],
              );
            });
          }
        }
      }

      // 5. Create a map of user_id -> profile for quick lookup
      const profilesMap = new Map(
        typedProfilesData.map((profile) => [profile.id, profile]),
      );

      // 6. Transform data to match expected structure
      const transformedData = typedStatsData.map((stat) => {
        const profile = profilesMap.get(stat.user_id);
        const filteredStats = filteredStatsByUser.get(stat.user_id);
        return {
          id: profile?.id || stat.user_id,
          username: profile?.username || `User ${stat.user_id.slice(0, 8)}`,
          avatar_url: profile?.avatar_url || null,
          stats: {
            total_sessions:
              filteredStats?.total_sessions ?? stat.total_sessions,
            completed_tasks:
              filteredStats?.completed_tasks ?? stat.completed_tasks,
            total_tasks: filteredStats?.total_tasks ?? stat.total_tasks,
            streak: filteredStats?.streak ?? stat.streak,
            total_focus_time:
              filteredStats?.total_focus_time ?? stat.total_focus_time,
            longest_streak:
              filteredStats?.longest_streak ?? stat.longest_streak,
          },
        };
      });

      return {
        data: transformedData,
        pagination: buildPaginationMeta({ page, limit }, totalCount || 0),
      };
    },
    { ttl: LEADERBOARD_DEFAULTS.SERVER_CACHE_TTL_MS },
  ); // Cache for 10 minutes

  return successResponse(result.data, { pagination: result.pagination });
}

export const GET = compose(
  withErrorHandling(),
  withLogging(),
  withQueryValidation(LeaderboardQuerySchema),
  withRateLimit("generous"),
)(getHandler);
