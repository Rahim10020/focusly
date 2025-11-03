'use client';

import { useState } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { TimerSettings } from '@/lib/hooks/useSettings';

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

                        <div className="flex gap-3">
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
        </div>
    );
}