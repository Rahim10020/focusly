/**
 * @fileoverview Settings component for configuring timer, sound, and privacy preferences.
 * Provides UI for customizing Pomodoro durations, auto-start options, and stat visibility.
 * @module components/settings/Settings
 */

'use client';

import { useState } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { TimerSettings } from '@/lib/hooks/useSettings';
import { useStatVisibility } from '@/lib/hooks/useStatVisibility';

/**
 * Predefined timer profiles for common Pomodoro techniques
 */
const PRESET_PROFILES = {
    classic: {
        name: 'Classic Pomodoro',
        description: '25 min work, 5 min break',
        workDuration: 1500, // 25 min
        shortBreakDuration: 300, // 5 min
        longBreakDuration: 900, // 15 min
        cyclesBeforeLongBreak: 4,
    },
    ultraFocus: {
        name: 'Ultra Focus',
        description: '45 min work, 10 min break',
        workDuration: 2700, // 45 min
        shortBreakDuration: 600, // 10 min
        longBreakDuration: 1800, // 30 min
        cyclesBeforeLongBreak: 3,
    },
    sprints: {
        name: 'Quick Sprints',
        description: '15 min work, 3 min break',
        workDuration: 900, // 15 min
        shortBreakDuration: 180, // 3 min
        longBreakDuration: 600, // 10 min
        cyclesBeforeLongBreak: 4,
    },
    deepWork: {
        name: 'Deep Work',
        description: '90 min work, 20 min break',
        workDuration: 5400, // 90 min
        shortBreakDuration: 1200, // 20 min
        longBreakDuration: 3600, // 60 min
        cyclesBeforeLongBreak: 2,
    },
};

/**
 * Props for the Settings component.
 * @interface SettingsProps
 */
interface SettingsProps {
    /** Current timer settings */
    settings: TimerSettings;
    /** Callback to update timer settings */
    onUpdateSettings: (updates: Partial<TimerSettings>) => void;
    /** Callback to reset settings to defaults */
    onReset: () => void;
    /** Whether sound notifications are enabled */
    soundEnabled: boolean;
    /** Callback to toggle sound on/off */
    onToggleSound: () => void;
}

/**
 * Settings configuration component for the Pomodoro timer application.
 * Allows users to customize timer durations, auto-start behavior, sound notifications,
 * and control which statistics are visible to friends.
 *
 * @param {SettingsProps} props - Component props
 * @returns {JSX.Element} Settings panel with multiple configuration cards
 *
 * @example
 * <Settings
 *   settings={timerSettings}
 *   onUpdateSettings={handleUpdateSettings}
 *   onReset={handleReset}
 *   soundEnabled={true}
 *   onToggleSound={handleToggleSound}
 * />
 */
export default function Settings({
    settings,
    onUpdateSettings,
    onReset,
    soundEnabled,
    onToggleSound,
}: SettingsProps) {
    const [workMinutes, setWorkMinutes] = useState(Math.floor(settings.workDuration / 60));
    const [shortBreakMinutes, setShortBreakMinutes] = useState(Math.floor(settings.shortBreakDuration / 60));
    const [longBreakMinutes, setLongBreakMinutes] = useState(Math.floor(settings.longBreakDuration / 60));
    const [cycles, setCycles] = useState(settings.cyclesBeforeLongBreak);
    const { visibilitySettings, loading: visibilityLoading, updateVisibility } = useStatVisibility();

    const getStatLabel = (field: string) => {
        const labels: Record<string, string> = {
            total_sessions: 'Total Sessions',
            completed_tasks: 'Completed Tasks',
            total_tasks: 'Total Tasks',
            streak: 'Current Streak',
            total_focus_time: 'Total Focus Time',
            longest_streak: 'Longest Streak',
            tasks_completed_today: 'Today\'s Tasks'
        };
        return labels[field] || field;
    };

    const handleSave = () => {
        onUpdateSettings({
            workDuration: workMinutes * 60,
            shortBreakDuration: shortBreakMinutes * 60,
            longBreakDuration: longBreakMinutes * 60,
            cyclesBeforeLongBreak: cycles,
        });
    };

    const applyPreset = (presetKey: keyof typeof PRESET_PROFILES) => {
        const preset = PRESET_PROFILES[presetKey];
        setWorkMinutes(Math.floor(preset.workDuration / 60));
        setShortBreakMinutes(Math.floor(preset.shortBreakDuration / 60));
        setLongBreakMinutes(Math.floor(preset.longBreakDuration / 60));
        setCycles(preset.cyclesBeforeLongBreak);

        // Immediately apply the preset
        onUpdateSettings({
            workDuration: preset.workDuration,
            shortBreakDuration: preset.shortBreakDuration,
            longBreakDuration: preset.longBreakDuration,
            cyclesBeforeLongBreak: preset.cyclesBeforeLongBreak,
        });
    };

    return (
        <div className="space-y-6">
            {/* Preset Profiles */}
            <Card>
                <CardHeader>
                    <CardTitle>Preset Profiles</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        Quick setup with popular Pomodoro techniques
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(PRESET_PROFILES).map(([key, profile]) => (
                            <button
                                key={key}
                                onClick={() => applyPreset(key as keyof typeof PRESET_PROFILES)}
                                className="p-4 text-left border border-border rounded-lg hover:bg-accent transition-colors cursor-pointer group"
                            >
                                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                                    {profile.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {profile.description}
                                </p>
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Custom Timer Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Custom Timer Settings</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                                type="number"
                                label="Work Duration (minutes)"
                                value={workMinutes}
                                onChange={(e) => setWorkMinutes(Number(e.target.value))}
                                min={1}
                                max={120}
                            />
                            <Input
                                type="number"
                                label="Short Break (minutes)"
                                value={shortBreakMinutes}
                                onChange={(e) => setShortBreakMinutes(Number(e.target.value))}
                                min={1}
                                max={60}
                            />
                            <Input
                                type="number"
                                label="Long Break (minutes)"
                                value={longBreakMinutes}
                                onChange={(e) => setLongBreakMinutes(Number(e.target.value))}
                                min={1}
                                max={60}
                            />
                        </div>

                        <Input
                            type="number"
                            label="Pomodoros before long break"
                            value={cycles}
                            onChange={(e) => setCycles(Number(e.target.value))}
                            min={2}
                            max={10}
                        />

                        <div className="flex-column space-y-3 md:space-y-0 md:flex items-center gap-3">
                            <Button onClick={handleSave}>Save Settings</Button>
                            <Button onClick={onReset} variant="secondary">
                                Reset to Default
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Auto-Start</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm text-foreground">
                                Auto-start breaks
                            </span>
                            <input
                                type="checkbox"
                                checked={settings.autoStartBreaks}
                                onChange={(e) => onUpdateSettings({ autoStartBreaks: e.target.checked })}
                                className="w-5 h-5 rounded border-border text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                            />
                        </label>

                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-sm text-foreground">
                                Auto-start pomodoros
                            </span>
                            <input
                                type="checkbox"
                                checked={settings.autoStartPomodoros}
                                onChange={(e) => onUpdateSettings({ autoStartPomodoros: e.target.checked })}
                                className="w-5 h-5 rounded border-border text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                            />
                        </label>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Sound & Notifications</CardTitle>
                </CardHeader>
                <CardContent>
                    <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-sm text-foreground">
                            Enable sound notifications
                        </span>
                        <input
                            type="checkbox"
                            checked={soundEnabled}
                            onChange={onToggleSound}
                            className="w-5 h-5 rounded border-border text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                        />
                    </label>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Stat Visibility</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Choose which stats are visible to your friends
                    </p>
                </CardHeader>
                <CardContent>
                    {visibilityLoading ? (
                        <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {visibilitySettings.map((setting) => (
                                <label key={setting.stat_field} className="flex items-center justify-between cursor-pointer">
                                    <span className="text-sm text-foreground">
                                        {getStatLabel(setting.stat_field)}
                                    </span>
                                    <input
                                        type="checkbox"
                                        checked={setting.visible_to_friends}
                                        onChange={(e) => updateVisibility(setting.stat_field, e.target.checked)}
                                        className="w-5 h-5 rounded border-border text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                                    />
                                </label>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}