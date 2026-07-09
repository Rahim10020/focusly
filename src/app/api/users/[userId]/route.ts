/**
 * @fileoverview User profile and statistics API route.
 *
 * Provides an endpoint to fetch a user's profile and statistics.
 * Supports privacy controls based on friendship status and visibility settings.
 * Works for both authenticated and unauthenticated users.
 *
 * Route: /api/users/[userId]
 */

import { z } from "zod";
import {
  compose,
  withErrorHandling,
  withLogging,
  withRateLimit,
  withOptionalAuth,
} from "@/lib/api/middleware";
import { successResponse, Errors } from "@/lib/api/utils/response";
import { getAdminSupabaseClient } from "@/lib/api/supabase";
import { logger } from "@/lib/logger";
import { Database } from "@/lib/supabase/database.types";
import type { AuthContext } from "@/lib/api/middleware/auth";

/**
 * User profile with statistics.
 */

// Validation schema for userId parameter
const UserIdSchema = z.string().uuid("Invalid user ID format");
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type StatsRow = Database["public"]["Tables"]["stats"]["Row"];
type PublicProfile = Pick<ProfileRow, "id" | "username" | "avatar_url">;
type PublicStats = Pick<
  StatsRow,
  | "total_sessions"
  | "completed_tasks"
  | "total_tasks"
  | "streak"
  | "total_focus_time"
  | "longest_streak"
  | "tasks_completed_today"
>;

/**
 * Derives a default username for a newly created profile.
 */
function deriveUsername(email?: string, userId?: string): string {
  if (email) {
    const local = email.split("@")[0]?.trim();
    if (local) return local;
  }
  return userId ? `user-${userId.slice(0, 8)}` : "user";
}

/**
 * Fetches a user's public or private profile based on authentication and friendship.
 */
async function getHandler(
  _request: any,
  context: unknown,
  _validatedData: unknown,
  auth: AuthContext | undefined,
) {
  const routeContext = context as { params: Promise<{ userId: string }> };
  const { userId } = await routeContext.params;

  // Validate userId format (UUID)
  const validationResult = UserIdSchema.safeParse(userId);
  if (!validationResult.success) {
    logger.warn("Invalid user ID format", {
      action: "userIdValidation",
      userId,
      errors: validationResult.error.format(),
    });
    return Errors.badRequest("Invalid user ID format");
  }

  const viewerId = auth?.userId;
  const supabase = getAdminSupabaseClient();

  // If viewing own profile, show all stats
  if (viewerId === userId) {
    let { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .eq("id", userId)
      .single();

    // Auto-create the profile if it is missing for the authenticated user.
    // The insert trigger then initializes the matching stats row.
    if ((profileError || !profileData) && auth?.userId) {
      const { data: created, error: createError } = await supabase
        .from("profiles")
        .insert({ id: userId, username: deriveUsername(auth.userEmail, userId) })
        .select("id, username, avatar_url")
        .single();

      if (createError || !created) {
        logger.error("Error creating user profile", createError as Error, {
          action: "createUserProfileOwn",
          userId,
        });
        return Errors.notFound("User not found");
      }

      profileData = created;
      profileError = null;
    }

    const { data: statsData, error: statsError } = await supabase
      .from("stats")
      .select(
        "total_sessions, completed_tasks, total_tasks, streak, total_focus_time, longest_streak, tasks_completed_today",
      )
      .eq("user_id", userId)
      .single();

    if (profileError || !profileData) {
      logger.error("Error fetching user profile", profileError as Error, {
        action: "getUserProfileOwn",
        userId,
      });
      return Errors.notFound("User not found");
    }

    // Stats may not exist yet (e.g. trigger hasn't run); treat as null.
    if (statsError && statsError.code !== "PGRST116") {
      logger.error("Error fetching user stats", statsError as Error, {
        action: "getUserStatsOwn",
        userId,
      });
      return Errors.notFound("User stats not found");
    }

    const data: PublicProfile & {
      stats: PublicStats | null;
      isFriend: boolean;
    } = {
      ...profileData,
      stats: (statsData as PublicStats | null) ?? null,
      isFriend: true,
    };
    return successResponse(data);
  }

  // Check if viewer is a friend
  const { data: friendship } = await supabase
    .from("friends")
    .select("id")
    .or(
      `and(sender_id.eq.${viewerId},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${viewerId})`,
    )
    .eq("status", "accepted")
    .single();

  const isFriend = !!friendship;

  // Get visibility settings
  const { data: visibilitySettings } = await supabase
    .from("stat_visibility")
    .select("stat_field, visible_to_friends")
    .eq("user_id", userId);

  const typedVisibilitySettings = (visibilitySettings ||
    []) as Database["public"]["Tables"]["stat_visibility"]["Row"][];

  const visibilityMap = new Map(
    typedVisibilitySettings.map((setting) => [
      setting.stat_field,
      setting.visible_to_friends,
    ]),
  );

  // Get profile and stats
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .eq("id", userId)
    .single();

  const { data: statsData, error: statsError } = await supabase
    .from("stats")
    .select(
      "total_sessions, completed_tasks, total_tasks, streak, total_focus_time, longest_streak, tasks_completed_today",
    )
    .eq("user_id", userId)
    .single();

  if (profileError || !profileData) {
    logger.error("Error fetching user profile", profileError as Error, {
      action: "getUserProfile",
      userId,
      viewerId,
    });
    return Errors.notFound("User not found");
  }

  if (statsError) {
    logger.error("Error fetching user stats", statsError as Error, {
      action: "getUserStats",
      userId,
      viewerId,
    });
    return Errors.notFound("User stats not found");
  }

  const userData: PublicProfile & {
    stats: Partial<PublicStats> | null;
    isFriend: boolean;
  } = {
    ...profileData,
    stats: (statsData as PublicStats | null) ?? null,
    isFriend,
  };

  // Filter stats based on visibility
  if (userData.stats && !isFriend) {
    const filteredStats: Partial<PublicStats> = {};
    for (const [key, value] of Object.entries(userData.stats)) {
      const visible = visibilityMap.get(key) ?? true; // Default to visible
      if (visible) {
        filteredStats[key as keyof PublicStats] =
          value as PublicStats[keyof PublicStats];
      }
      // Don't add the key if not visible (better security - doesn't reveal which fields exist)
    }
    userData.stats = filteredStats;
  }

  return successResponse(userData);
}

export const GET = compose(
  withErrorHandling(),
  withOptionalAuth(),
  withLogging(),
  withRateLimit("generous"),
)(getHandler);
