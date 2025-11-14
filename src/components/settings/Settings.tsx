'use client';

import { useState } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { TimerSettings } from '@/lib/hooks/useSettings';
import { useStatVisibility } from '@/lib/hooks/useStatVisibility';

interface SettingsProps {
    settings: TimerSettings;
    onUpdateSettings: (updates: Partial<TimerSettings>) => void;
    onReset: () => void;
    soundEnabled: boolean;
    onToggleSound: () => void;
}

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

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Timer Settings</CardTitle>
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