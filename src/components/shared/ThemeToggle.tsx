/**
 * @fileoverview Toggle button component for switching between light and dark themes.
 */

'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';

/**
 * A button component for toggling between light and dark themes.
 * Uses the ThemeProvider context to manage theme state.
 * Returns a placeholder during hydration to prevent flash.
 *
 * @returns {JSX.Element} The rendered theme toggle button
 *
 * @example
 * // In a header component
 * <header>
 *   <ThemeToggle />
 * </header>
 */
export default function ThemeToggle() {
    const { theme, toggleTheme, mounted } = useTheme();

    // Éviter le flash pendant l'hydratation
    if (!mounted) {
        return <div className="p-2 rounded-full w-9 h-9" />;
    }

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full cursor-pointer hover:bg-muted transition-colors"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-brand-secondary" />
            ) : (
                <Moon className="h-5 w-5 text-muted-foreground" />
            )}
        </button>
    );
}