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

/**
 * LocalStorage keys for persisting application state.
 * @constant
 */
export const STORAGE_KEYS = {
    /** Key for storing tasks array */
    TASKS: 'focusly_tasks',
    /** Key for storing Pomodoro sessions */
    SESSIONS: 'focusly_sessions',
    /** Key for storing user statistics */
    STATS: 'focusly_stats',
    /** Key for storing theme preference */
    THEME: 'focusly_theme',
} as const;

/**
 * Application color palette.
 * @constant
 */
export const COLORS = {
    /** Background colors for light and dark themes */
    background: {
        light: '#F8F4E3',
        dark: '#1A1A1A',
    },
    /** Primary brand color */
    primary: '#7D6E5C',
    /** Accent color for highlights */
    accent: '#A6937C',
} as const;

/** Number of Pomodoro cycles before a long break (typically 4) */
export const POMODORO_CYCLES_FOR_LONG_BREAK = 4;