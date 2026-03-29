/**
 * @fileoverview Pomodoro timer constants.
 * Configuration for work sessions, breaks, and cycles.
 */

import { TIME_SECONDS } from "./time";

/** Default Pomodoro work session duration in seconds (25 minutes) */
export const POMODORO_DURATION = 25 * TIME_SECONDS.MINUTE;

/** Default short break duration in seconds (5 minutes) */
export const SHORT_BREAK = 5 * TIME_SECONDS.MINUTE;

/** Default long break duration in seconds (15 minutes) */
export const LONG_BREAK = 15 * TIME_SECONDS.MINUTE;

/** Number of Pomodoro cycles before a long break (typically 4) */
export const POMODORO_CYCLES_FOR_LONG_BREAK = 4;

/** Default timer settings shared across timer and settings UI. */
export const TIMER_DEFAULTS = {
  workDuration: POMODORO_DURATION,
  shortBreakDuration: SHORT_BREAK,
  longBreakDuration: LONG_BREAK,
  cyclesBeforeLongBreak: POMODORO_CYCLES_FOR_LONG_BREAK,
  autoStartBreaks: false,
  autoStartPomodoros: false,
} as const;
