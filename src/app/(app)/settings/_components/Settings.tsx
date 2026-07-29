/**
 * @fileoverview Settings component for configuring timer, sound, and privacy preferences.
 * Provides UI for customizing Pomodoro durations, auto-start options, and stat visibility.
 * @module components/settings/Settings
 */

"use client";

import { useState } from "react";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { TimerSettings } from "@/hooks/useSettings";
import { useStatVisibility } from "@/hooks/useStatVisibility";
import { useNotificationsContext } from "@/components/providers/NotificationsProvider";
import { PresetProfiles } from "./PresetProfiles";
import { AutoStartSettings } from "./AutoStartSettings";
import { MyLoader } from "@/components/shared/MyLoader";
import {
  LONG_BREAK,
  POMODORO_CYCLES_FOR_LONG_BREAK,
  POMODORO_DURATION,
  SHORT_BREAK,
} from "@/constants";

/**
 * Predefined timer profiles for common Pomodoro techniques
 */
const PRESET_PROFILES = {
  classic: {
    name: "Classic Pomodoro",
    description: "25 min work, 5 min break",
    workDuration: POMODORO_DURATION,
    shortBreakDuration: SHORT_BREAK,
    longBreakDuration: LONG_BREAK,
    cyclesBeforeLongBreak: POMODORO_CYCLES_FOR_LONG_BREAK,
  },
  ultraFocus: {
    name: "Ultra Focus",
    description: "45 min work, 10 min break",
    workDuration: 2700, // 45 min
    shortBreakDuration: 600, // 10 min
    longBreakDuration: 1800, // 30 min
    cyclesBeforeLongBreak: 3,
  },
  sprints: {
    name: "Quick Sprints",
    description: "15 min work, 3 min break",
    workDuration: 900, // 15 min
    shortBreakDuration: 180, // 3 min
    longBreakDuration: 600, // 10 min
    cyclesBeforeLongBreak: 4,
  },
  deepWork: {
    name: "Deep Work",
    description: "90 min work, 20 min break",
    workDuration: 5400, // 90 min
    shortBreakDuration: 1200, // 20 min
    longBreakDuration: 3600, // 60 min
    cyclesBeforeLongBreak: 2,
  },
};

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

export default function Settings({
  settings,
  onUpdateSettings,
  onReset,
  soundEnabled,
  onToggleSound,
}: SettingsProps) {
  const { permission, requestPermission } = useNotificationsContext();
  const [workMinutes, setWorkMinutes] = useState(
    Math.floor(settings.workDuration / 60),
  );
  const [shortBreakMinutes, setShortBreakMinutes] = useState(
    Math.floor(settings.shortBreakDuration / 60),
  );
  const [longBreakMinutes, setLongBreakMinutes] = useState(
    Math.floor(settings.longBreakDuration / 60),
  );
  const [cycles, setCycles] = useState(settings.cyclesBeforeLongBreak);
  const {
    visibilitySettings,
    loading: visibilityLoading,
    updateVisibility,
  } = useStatVisibility();

  const getStatLabel = (field: string) => {
    const labels: Record<string, string> = {
      total_sessions: "Total Sessions",
      completed_tasks: "Completed Tasks",
      total_tasks: "Total Tasks",
      streak: "Current Streak",
      total_focus_time: "Total Focus Time",
      longest_streak: "Longest Streak",
      tasks_completed_today: "Today's Tasks",
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
      <PresetProfiles
        presets={PRESET_PROFILES}
        onApplyPreset={(key) =>
          applyPreset(key as keyof typeof PRESET_PROFILES)
        }
      />

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
            <div className="max-w-50">
              <Input
                type="number"
                label="Pomodoros before long break"
                value={cycles}
                onChange={(e) => setCycles(Number(e.target.value))}
                min={2}
                max={10}
              />
            </div>

            <div className="flex-column space-y-3 md:space-y-0 md:flex items-center md:justify-end mt-12x gap-3">
              <Button onClick={handleSave}>Save Settings</Button>
              <Button onClick={onReset} variant="secondary">
                Reset to Default
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AutoStartSettings
        settings={settings}
        onUpdateSettings={onUpdateSettings}
      />

      <Card>
        <CardHeader>
          <CardTitle>Sound & Notifications</CardTitle>
          <p className="text-lg text-muted-foreground mt-2">
            Choose which sounds to enable.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mt-12">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xl font-normal text-foreground">
                Enable sound notifications
              </span>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={onToggleSound}
                className="w-5 h-5 rounded border-border text-primary focus:ring-2 focus:ring-primary cursor-pointer"
              />
            </label>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-normal text-xl">Browser Notifications</h3>
                <p className="text-xs text-muted-foreground">
                  {permission === "granted" ? "Enabled" : "Not enabled"}
                </p>
              </div>
              {permission !== "granted" && (
                <button
                  onClick={requestPermission}
                  className="px-3 py-1 rounded-md bg-primary text-white text-sm"
                >
                  Enable
                </button>
              )}
              {permission === "granted" && (
                <span className="text-green-500">✓ Enabled</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stat Visibility</CardTitle>
          <p className="text-lg text-muted-foreground mt-2">
            Choose which stats are visible to your friends.
          </p>
        </CardHeader>
        <CardContent>
          {visibilityLoading ? (
            <div className="text-center py-4">
              <MyLoader label="Loading" />
            </div>
          ) : (
            <div className="space-y-4 mt-12">
              {visibilitySettings.map((setting) => (
                <label
                  key={setting.stat_field}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span className="text-sm text-foreground">
                    {getStatLabel(setting.stat_field)}
                  </span>
                  <input
                    type="checkbox"
                    checked={setting.visible_to_friends}
                    onChange={(e) =>
                      updateVisibility(setting.stat_field, e.target.checked)
                    }
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
