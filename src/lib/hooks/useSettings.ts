/**
 * @fileoverview User settings management hook.
 * Manages timer settings including work duration, break durations,
 * cycle configuration, and auto-start preferences with localStorage persistence.
 */

import { useLocalStorage } from './useLocalStorage';

/**
 * Timer configuration settings interface.
 * @interface TimerSettings
 */
export interface TimerSettings {
    /** Work session duration in seconds */
    workDuration: number;
    /** Short break duration in seconds */
    shortBreakDuration: number;
    /** Long break duration in seconds */
    longBreakDuration: number;
    /** Number of work cycles before a long break */
    cyclesBeforeLongBreak: number;
    /** Whether to automatically start breaks after work sessions */
    autoStartBreaks: boolean;
    /** Whether to automatically start work sessions after breaks */
    autoStartPomodoros: boolean;
}

/**
 * Default timer settings following standard Pomodoro technique.
 * @constant
 */
const DEFAULT_SETTINGS: TimerSettings = {
    workDuration: 25 * 60, // 25 minutes
    shortBreakDuration: 5 * 60, // 5 minutes
    longBreakDuration: 15 * 60, // 15 minutes
    cyclesBeforeLongBreak: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false,
};

/**
 * Hook for managing user timer settings.
 * Persists settings to localStorage and provides update/reset functionality.
 *
 * @returns {Object} Settings state and management functions
 * @returns {TimerSettings} returns.settings - Current timer settings
 * @returns {Function} returns.updateSettings - Update one or more settings
 * @returns {Function} returns.resetSettings - Reset all settings to defaults
 * @returns {TimerSettings} returns.defaultSettings - Default settings reference
 *
 * @example
 * const { settings, updateSettings, resetSettings } = useSettings();
 *
 * // Update work duration to 30 minutes
 * updateSettings({ workDuration: 30 * 60 });
 *
 * // Enable auto-start for breaks
 * updateSettings({ autoStartBreaks: true });
 *
 * // Reset all settings to defaults
 * resetSettings();
 */
export function useSettings() {
    const [settings, setSettings] = useLocalStorage<TimerSettings>(
        'focusly_settings',
        DEFAULT_SETTINGS
    );

    const updateSettings = (updates: Partial<TimerSettings>) => {
        setSettings({ ...settings, ...updates });
    };

    const resetSettings = () => {
        setSettings(DEFAULT_SETTINGS);
    };

    return {
        settings,
        updateSettings,
        resetSettings,
        defaultSettings: DEFAULT_SETTINGS,
    };
}