/**
 * @fileoverview Preset profiles component for settings
 */

"use client";

import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

interface PresetProfile {
  name: string;
  description: string;
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  cyclesBeforeLongBreak: number;
}

interface PresetProfilesProps {
  presets: Record<string, PresetProfile>;
  onApplyPreset: (presetKey: string) => void;
}

export function PresetProfiles({
  presets,
  onApplyPreset,
}: PresetProfilesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preset Profiles</CardTitle>
        <p className="text-lg text-muted-foreground mt-1">
          Quick setup with popular Pomodoro techniques
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
          {Object.entries(presets).map(([key, profile]) => (
            <button
              key={key}
              onClick={() => onApplyPreset(key)}
              className="p-4 text-left border border-border rounded-lg hover:bg-accent transition-colors cursor-pointer group"
            >
              <h3 className="text-2xl font-medium mb-1 group-hover:text-primary transition-colors">
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
  );
}
