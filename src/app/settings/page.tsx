/**
 * @fileoverview Settings page for the Focusly application.
 * Allows users to customize timer durations, auto-start behavior,
 * sound preferences, and other application settings.
 * @module app/settings/page
 */

'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Settings from '@/components/settings/Settings';
import { useSettings } from '@/lib/hooks/useSettings';
import { useSound } from '@/lib/hooks/useSound';

/**
 * Settings page component for customizing Focusly preferences.
 * Provides controls for timer settings, sound preferences, and reset options.
 *
 * @returns {JSX.Element} The rendered settings page
 */
export default function SettingsPage() {
    const [isClient, setIsClient] = useState(false);
    const { settings, updateSettings, resetSettings } = useSettings();
    const { soundEnabled, toggleSound } = useSound();

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
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
            </main>
        </div>
    );
}