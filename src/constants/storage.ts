/**
 * @fileoverview LocalStorage keys for persisting application state.
 * Centralized storage keys to prevent duplication and ensure consistency.
 */

export const STORAGE_KEYS = {
  // Task management
  TASKS: "focusly_tasks",
  ACTIVE_TASK: "focusly_active_task",
  TAGS: "focusly_tags",

  // Pomodoro & Sessions
  SESSIONS: "focusly_sessions",
  POMODORO_STATE: "focusly_pomodoro_state",

  // Statistics
  STATS: "focusly_stats",

  // User preferences
  SETTINGS: "focusly_settings",
  SOUND_ENABLED: "focusly_sound_enabled",

  // Gamification
  ACHIEVEMENTS: "focusly_achievements",
  NOTIFIED_ACHIEVEMENTS: "focusly_notified_achievements",
} as const;

export type StorageKey = keyof typeof STORAGE_KEYS;
