'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

type Theme = 'light' | 'dark';

export function useTheme() {
    const [theme, setTheme] = useState<Theme>('light');
    const [mounted, setMounted] = useState(false);
    const { data: session } = useSession();

    // Récupérer le thème depuis le localStorage ou le thème système
    useEffect(() => {
        setMounted(true);

        // Récupérer le thème depuis le localStorage
        const savedTheme = localStorage.getItem('focusly_theme') as Theme | null;
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

        // Si l'utilisateur est connecté, on utilisera le thème sauvegardé côté serveur
        // qui sera chargé via la session
        const initialTheme = savedTheme || systemTheme;

        setTheme(initialTheme);
        applyTheme(initialTheme);

        // Écouter les changements de thème système
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            const newTheme = e.matches ? 'dark' : 'light';
            // Ne mettre à jour que si l'utilisateur n'a pas de préférence enregistrée
            if (!localStorage.getItem('focusly_theme')) {
                setTheme(newTheme);
                applyTheme(newTheme);
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // Synchroniser avec le thème de l'utilisateur connecté
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
        root.classList.remove('light', 'dark');
        root.classList.add(theme);

        // Ajouter la classe au body pour les styles globaux
        document.body.classList.toggle('dark', theme === 'dark');
    };

    const toggleTheme = async () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        applyTheme(newTheme);
        localStorage.setItem('focusly_theme', newTheme);

        // Si l'utilisateur est connecté, mettre à jour la préférence côté serveur
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
