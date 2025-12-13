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
    const [mounted, setMounted] = useState(false);
    const { data: session } = useSession();

    // Retrieve theme from localStorage
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        setMounted(true);

        const savedTheme = localStorage.getItem('focusly_theme') as Theme | null;
        // compute initial theme without referencing React state to avoid hook dependency issues
        const initialTheme = savedTheme || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

        setTheme(initialTheme);
        applyThemeToDocument(initialTheme);

        // Listen for system theme changes (but don't apply them automatically)
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            // Intentionally left blank to avoid automatic changes
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // Synchronize with the logged-in user's theme
    useEffect(() => {
        if (session?.user?.themePreference) {
            const newTheme = session.user.themePreference as Theme;
            setTheme(newTheme);
            applyThemeToDocument(newTheme);
            localStorage.setItem('focusly_theme', newTheme);
        }
    }, [session]);

    const toggleTheme = async () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
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

    return { theme, toggleTheme, mounted };
}
