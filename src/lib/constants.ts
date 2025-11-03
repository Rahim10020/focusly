export const POMODORO_DURATION = 25 * 60;
export const SHORT_BREAK = 5 * 60;
export const LONG_BREAK = 15 * 60;

export const STORAGE_KEYS = {
    TASKS: 'focusly_tasks',
    SESSIONS: 'focusly_sessions',
    STATS: 'focusly_stats',
    THEME: 'focusly_theme',
} as const;

export const COLORS = {
    background: {
        light: '#F8F4E3',
        dark: '#1A1A1A',
    },
    primary: '#7D6E5C',
    accent: '#A6937C',
} as const;

export const POMODORO_CYCLES_FOR_LONG_BREAK = 4;