import { TIME_MS } from "./time";

/** Shared cache and pagination defaults for leaderboard flows. */
export const LEADERBOARD_DEFAULTS = {
  PAGE_SIZE: 20,
  CLIENT_CACHE_TTL_MS: TIME_MS.MINUTE,
  SERVER_CACHE_TTL_MS: 10 * TIME_MS.MINUTE,
  MAX_OFFSET: 10000,
} as const;
