/**
 * @fileoverview Centralized constants barrel.
 * All application constants exported from a single location.
 *
 * Usage: import { ROUTES, STORAGE_KEYS, TIME_MS } from '@/lib/constants';
 */

// Time & Duration
export { TIME_MS, TIME_SECONDS } from "./time";

// Pomodoro & Timer
export {
  POMODORO_DURATION,
  SHORT_BREAK,
  LONG_BREAK,
  POMODORO_CYCLES_FOR_LONG_BREAK,
  TIMER_DEFAULTS,
} from "./pomodoro";

// Storage
export { STORAGE_KEYS } from "./storage";
export type { StorageKey } from "./storage";

// Navigation
export { ROUTES, DYNAMIC_ROUTES } from "./routes";
export type { Route } from "./routes";

// Caching
export { CACHE_DEFAULT_TTL_MS, CACHE_CONFIG } from "./cache";

// Leaderboard
export { LEADERBOARD_DEFAULTS, LEADERBOARD_SORT_OPTIONS } from "./leaderboard";

// Rate Limiting
export { RATE_LIMIT_WINDOWS_MS, RATE_LIMIT_THRESHOLDS } from "./rateLimit";

// Toast & Notifications
export {
  TOAST_DURATION,
  TOAST_DEFAULT_DURATION_MS,
  TOAST_TYPES,
  TOAST_MESSAGES,
} from "./toast";

// API Endpoints
export { API_ROUTES, API_DYNAMIC_ROUTES } from "./api";
export type { ApiRoute } from "./api";
