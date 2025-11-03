'use client';

import Header from '@/components/layout/Header';
import Settings from '@/components/settings/Settings';
import { useSettings } from '@/lib/hooks/useSettings';
import { useSound } from '@/lib/hooks/useSound';

export default function SettingsPage() {
    const { settings, updateSettings, resetSettings } = useSettings();
    const { soundEnabled, toggleSound } = useSound();

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
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