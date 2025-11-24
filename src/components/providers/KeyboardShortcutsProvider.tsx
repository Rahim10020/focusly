'use client';

import { useKeyboardShortcuts, GLOBAL_SHORTCUTS } from '@/lib/hooks/useKeyboardShortcuts';
import { useRouter } from 'next/navigation';
import { useTheme } from './ThemeProvider';

interface KeyboardShortcutsProviderProps {
    children: React.ReactNode;
}

export default function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
    const router = useRouter();
    const { toggleTheme } = useTheme();

    // Global keyboard shortcuts that work on all pages
    useKeyboardShortcuts([
        {
            ...GLOBAL_SHORTCUTS.TOGGLE_THEME,
            action: toggleTheme,
        },
        {
            ...GLOBAL_SHORTCUTS.SHOW_SHORTCUTS,
            action: () => {
                // This will be handled by the modal in each page
                // For now, just focus on navigation shortcuts
            },
        },
        {
            ...GLOBAL_SHORTCUTS.GO_TO_HOME,
            action: () => router.push('/'),
        },
        {
            ...GLOBAL_SHORTCUTS.GO_TO_STATS,
            action: () => router.push('/stats'),
        },
        {
            ...GLOBAL_SHORTCUTS.GO_TO_SETTINGS,
            action: () => router.push('/settings'),
        },
        {
            ...GLOBAL_SHORTCUTS.GO_TO_LEADERBOARD,
            action: () => router.push('/leaderboard'),
        },
        {
            ...GLOBAL_SHORTCUTS.GO_TO_FRIENDS,
            action: () => router.push('/friends'),
        },
    ]);

    return <>{children}</>;
}