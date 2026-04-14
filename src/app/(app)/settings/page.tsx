/**
 * @fileoverview Settings page for the Focusly application.
 * Allows users to customize timer durations, auto-start behavior,
 * sound preferences, and other application settings.
 * @module app/settings/page
 */

"use client";

import Settings from "@/app/(app)/settings/_components/Settings";
import { useSettings } from "@/hooks/useSettings";
import { useSound } from "@/hooks/useSound";

/**
 * Settings page component for customizing Focusly preferences.
 * Provides controls for timer settings, sound preferences, and reset options.
 */
export default function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { soundEnabled, toggleSound } = useSound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Customize your Focusly experience
        </p>
      </div>

      <Settings
        settings={settings}
        onUpdateSettings={updateSettings}
        onReset={resetSettings}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
      />
    </div>
  );
}
