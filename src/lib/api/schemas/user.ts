/**
 * Validation schemas for User API endpoints
 */
import { z } from "zod";

/**
 * Schema for updating user preferences
 * PUT /api/users/preferences
 */
export const UpdateUserPreferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  language: z.string().length(2).optional(), // e.g., 'en', 'fr'
  notifications_enabled: z.boolean().optional(),
  email_notifications: z.boolean().optional(),
  sound_enabled: z.boolean().optional(),
  daily_goal: z.number().int().positive().max(24).optional(), // hours per day
  focus_time_default: z.number().int().positive().max(120).optional(), // minutes
  break_time_default: z.number().int().positive().max(60).optional(), // minutes
  timezone: z.string().optional(),
});

/**
 * Schema for updating user profile
 * PUT /api/user/profile
 */
export const UpdateUserProfileSchema = z.object({
  display_name: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  avatar_url: z.string().url().optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().optional(),
  is_profile_public: z.boolean().optional(),
  show_stats_publicly: z.boolean().optional(),
});

/**
 * Schema for query parameters when getting leaderboard
 * GET /api/leaderboard
 */
const LegacyLeaderboardTimeframeSchema = z.enum([
  "daily",
  "weekly",
  "monthly",
  "all_time",
]);
const LeaderboardTimeFilterSchema = z.enum(["all", "week", "month"]);

export const LeaderboardQuerySchema = z
  .object({
    // New filter used by UI
    timeFilter: LeaderboardTimeFilterSchema.optional(),
    // Legacy filter kept for backward compatibility
    timeframe: LegacyLeaderboardTimeframeSchema.optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  })
  .transform((input) => {
    const fallbackFromLegacy = input.timeframe
      ? {
          all_time: "all",
          monthly: "month",
          weekly: "week",
          daily: "week",
        }[input.timeframe]
      : undefined;

    return {
      page: input.page,
      limit: input.limit,
      timeFilter: input.timeFilter ?? fallbackFromLegacy ?? "all",
    };
  });

export type UpdateUserPreferencesInput = z.infer<
  typeof UpdateUserPreferencesSchema
>;
export type UpdateUserProfileInput = z.infer<typeof UpdateUserProfileSchema>;
export type LeaderboardQuery = z.infer<typeof LeaderboardQuerySchema>;
