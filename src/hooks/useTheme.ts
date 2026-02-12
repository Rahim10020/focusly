/**
 * @fileoverview Theme management hook for light/dark mode switching.
 * Handles theme persistence in localStorage and synchronization with user preferences.
 * @module hooks/useTheme
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Available theme options.
 * @typedef {'light' | 'dark'} Theme
 */
type Theme = 'light' | 'dark';

/**
 * Custom hook for managing application theme (light/dark mode).
 * Persists theme choice to localStorage and syncs with user account preferences.
 *
 * @returns {Object} Theme state and controls
 * @returns {Theme} returns.theme - Current theme ('light' or 'dark')
 * @returns {Function} returns.toggleTheme - Function to switch between themes
 * @returns {boolean} returns.mounted - Whether the component has mounted (for hydration safety)
 *
 * @example
 * function ThemeButton() {
 *   const { theme, toggleTheme, mounted } = useTheme();
 *
 *   if (!mounted) return null;
 *
 *   return (
 *     <button onClick={toggleTheme}>
 *       Current: {theme}
 *     </button>
 *   );
 * }
 */

// Apply theme helper declared as a standalone function so it can be used safely
function applyThemeToDocument(t: 'light' | 'dark') {
    if (typeof window === 'undefined' || !window.document) return;
    const root = window.document.documentElement;
    if (t === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
}

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(() => {
        // Synchronously read the saved theme on initial render (client-only)
        try {
            if (typeof window === 'undefined') return 'light';
            const savedTheme = localStorage.getItem('focusly_theme') as Theme | null;
            if (savedTheme) return savedTheme;
            return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        } catch {
            return 'light';
        }
    });
    const { data: session } = useSession();
    const preferredTheme = session?.user?.themePreference as Theme | undefined;
    const effectiveTheme = preferredTheme || theme;

    // Keep DOM and localStorage in sync with the effective theme.
    useEffect(() => {
        applyThemeToDocument(effectiveTheme);
        localStorage.setItem('focusly_theme', effectiveTheme);
    }, [effectiveTheme]);

    const toggleTheme = async () => {
        const currentTheme = effectiveTheme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        applyThemeToDocument(newTheme);

        // Always save the preference
        localStorage.setItem('focusly_theme', newTheme);

        // Update server-side preference if logged in
        if (session) {
            try {
                await fetch('/api/user/preferences', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ theme: newTheme }),
                });
            } catch (error) {
                console.error('Failed to update theme preference', error);
            }
        }
    };

    return { theme: effectiveTheme, toggleTheme, mounted: true };
}
