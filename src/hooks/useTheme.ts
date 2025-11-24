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
export function useTheme() {
    const [theme, setTheme] = useState<Theme>('light');
    const [mounted, setMounted] = useState(false);
    const { data: session } = useSession();

    // Retrieve theme from localStorage
    useEffect(() => {
        setMounted(true);

        const savedTheme = localStorage.getItem('focusly_theme') as Theme | null;
        const initialTheme = savedTheme || 'light';

        setTheme(initialTheme);
        applyTheme(initialTheme);

        // Listen for system theme changes (but don't apply them automatically)
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            // Do nothing here to avoid automatic changes
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // Synchronize with the logged-in user's theme
    useEffect(() => {
        if (session?.user?.themePreference) {
            const newTheme = session.user.themePreference as Theme;
            setTheme(newTheme);
            applyTheme(newTheme);
            localStorage.setItem('focusly_theme', newTheme);
        }
    }, [session]);

    const applyTheme = (theme: Theme) => {
        const root = window.document.documentElement;
        // Tailwind CSS uses only the 'dark' class on the html element
        // Light mode is the default (no class)
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    };

    const toggleTheme = async () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        applyTheme(newTheme);

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

    return { theme, toggleTheme, mounted };
}
