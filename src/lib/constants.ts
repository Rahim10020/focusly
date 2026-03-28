/**
 * @fileoverview Application constants for Pomodoro timing, storage, and theming.
 * Centralizes configuration values used throughout the application.
 * @module lib/constants
 */

/** Default Pomodoro work session duration in seconds (25 minutes) */
export const POMODORO_DURATION = 25 * 60;

/** Default short break duration in seconds (5 minutes) */
export const SHORT_BREAK = 5 * 60;

/** Default long break duration in seconds (15 minutes) */
export const LONG_BREAK = 15 * 60;

/** Number of Pomodoro cycles before a long break (typically 4) */
export const POMODORO_CYCLES_FOR_LONG_BREAK = 4;

/** Reusable time constants in milliseconds. */
export const TIME_MS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
} as const;

/** Default timer settings shared across timer and settings UI. */
export const TIMER_DEFAULTS = {
  workDuration: POMODORO_DURATION,
  shortBreakDuration: SHORT_BREAK,
  longBreakDuration: LONG_BREAK,
  cyclesBeforeLongBreak: POMODORO_CYCLES_FOR_LONG_BREAK,
  autoStartBreaks: false,
  autoStartPomodoros: false,
} as const;

/**
 * LocalStorage keys for persisting application state.
 * @constant
 */
export const STORAGE_KEYS = {
  /** Key for storing tasks array */
  TASKS: "focusly_tasks",
  /** Key for storing Pomodoro sessions */
  SESSIONS: "focusly_sessions",
  /** Key for storing user statistics */
  STATS: "focusly_stats",
  /** Key for storing theme preference */
  THEME: "focusly_theme",
  /** Key for storing timer settings */
  SETTINGS: "focusly_settings",
  /** Key for storing persisted pomodoro runtime state */
  POMODORO_STATE: "focusly_pomodoro_state",
  /** Key for storing sound enabled preference */
  SOUND_ENABLED: "focusly_sound_enabled",
  /** Key for storing current active task id */
  ACTIVE_TASK: "focusly_active_task",
  /** Key for storing tag list */
  TAGS: "focusly_tags",
  /** Key for storing achievements list */
  ACHIEVEMENTS: "focusly_achievements",
  /** Key for storing achievement notifications already shown */
  NOTIFIED_ACHIEVEMENTS: "focusly_notified_achievements",
} as const;

/** Shared cache and pagination defaults for leaderboard flows. */
export const LEADERBOARD_DEFAULTS = {
  PAGE_SIZE: 20,
  CLIENT_CACHE_TTL_MS: TIME_MS.MINUTE,
  SERVER_CACHE_TTL_MS: 10 * TIME_MS.MINUTE,
  MAX_OFFSET: 10000,
} as const;

/** Default cache lifetime when no specific TTL is provided. */
export const CACHE_DEFAULT_TTL_MS = 5 * TIME_MS.MINUTE;

/** Common durations used by the toast system. */
export const TOAST_DEFAULT_DURATION_MS = 5000;

/** Shared rate-limit windows used across middleware and server helpers. */
export const RATE_LIMIT_WINDOWS_MS = {
  TEN_SECONDS: 10 * TIME_MS.SECOND,
  ONE_MINUTE: TIME_MS.MINUTE,
  FIFTEEN_MINUTES: 15 * TIME_MS.MINUTE,
} as const;
