/**
 * @fileoverview Cache configuration and defaults.
 * Used for both L1 (memory) and L2 (Supabase) caching strategies.
 */

import { TIME_MS } from "./time";

/** Default cache lifetime when no specific TTL is provided. */
export const CACHE_DEFAULT_TTL_MS = 5 * TIME_MS.MINUTE;

/** Cache configuration for different data types */
export const CACHE_CONFIG = {
  // Task cache
  TASKS: {
    TTL_MS: 2 * TIME_MS.MINUTE,
    MAX_ITEMS: 1000,
  },
  // Stats cache
  STATS: {
    TTL_MS: 5 * TIME_MS.MINUTE,
    MAX_ITEMS: 100,
  },
  // User cache
  USER: {
    TTL_MS: 10 * TIME_MS.MINUTE,
    MAX_ITEMS: 500,
  },
  // Leaderboard cache
  LEADERBOARD: {
    TTL_MS: TIME_MS.MINUTE,
    MAX_ITEMS: 200,
  },
} as const;
