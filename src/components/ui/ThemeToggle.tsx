'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';

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