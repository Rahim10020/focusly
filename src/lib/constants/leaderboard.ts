/**
 * @fileoverview Leaderboard configuration and defaults.
 * Pagination and caching settings for leaderboard pages.
 */

import { TIME_MS } from "./time";

/** Shared cache and pagination defaults for leaderboard flows. */
export const LEADERBOARD_DEFAULTS = {
  PAGE_SIZE: 20,
  CLIENT_CACHE_TTL_MS: TIME_MS.MINUTE,
  SERVER_CACHE_TTL_MS: 10 * TIME_MS.MINUTE,
  MAX_OFFSET: 10000,
} as const;

/** Leaderboard sorting options */
export const LEADERBOARD_SORT_OPTIONS = {
  STREAK: "streak",
  FOCUS_TIME: "focus_time",
  COMPLETED_TASKS: "completed_tasks",
  TOTAL_SESSIONS: "total_sessions",
} as const;
