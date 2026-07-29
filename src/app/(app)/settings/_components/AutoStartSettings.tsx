/**
 * @fileoverview Auto-start settings component
 */

"use client";

import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { TimerSettings } from "@/hooks/useSettings";

interface AutoStartSettingsProps {
  settings: TimerSettings;
  onUpdateSettings: (updates: Partial<TimerSettings>) => void;
}

export function AutoStartSettings({
  settings,
  onUpdateSettings,
}: AutoStartSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Auto-Start</CardTitle>
        <p className="text-lg text-muted-foreground mt-2">
          What do you want to auto-start ?
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 mt-12">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xl font-normal text-foreground">
              Auto-start breaks
            </span>
            <input
              type="checkbox"
              checked={settings.autoStartBreaks}
              onChange={(e) =>
                onUpdateSettings({ autoStartBreaks: e.target.checked })
              }
              className="w-5 h-5 rounded border-border text-primary focus:ring-2 focus:ring-primary cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xl font-normal text-foreground">
              Auto-start pomodoros
            </span>
            <input
              type="checkbox"
              checked={settings.autoStartPomodoros}
              onChange={(e) =>
                onUpdateSettings({ autoStartPomodoros: e.target.checked })
              }
              className="w-5 h-5 rounded border-border text-primary focus:ring-2 focus:ring-primary cursor-pointer"
            />
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
