import { useLocalStorage } from './useLocalStorage';

export interface TimerSettings {
    workDuration: number; // en secondes
    shortBreakDuration: number;
    longBreakDuration: number;
    cyclesBeforeLongBreak: number;
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
}

const DEFAULT_SETTINGS: TimerSettings = {
    workDuration: 25 * 60, // 25 minutes
    shortBreakDuration: 5 * 60, // 5 minutes
    longBreakDuration: 15 * 60, // 15 minutes
    cyclesBeforeLongBreak: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false,
};

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