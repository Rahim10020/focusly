/** Default Pomodoro work session duration in seconds (25 minutes) */
export const POMODORO_DURATION = 25 * 60;

/** Default short break duration in seconds (5 minutes) */
export const SHORT_BREAK = 5 * 60;

/** Default long break duration in seconds (15 minutes) */
export const LONG_BREAK = 15 * 60;

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
