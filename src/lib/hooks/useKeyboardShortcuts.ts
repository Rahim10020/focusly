import { useEffect } from 'react';
import { KeyboardShortcut } from '@/types';

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled: boolean = true) {
    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            // Ignore shortcuts when typing in input fields
            const target = event.target as HTMLElement;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                return;
            }

            for (const shortcut of shortcuts) {
                const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
                const ctrlMatch = shortcut.ctrlKey ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
                const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
                const altMatch = shortcut.altKey ? event.altKey : !event.altKey;

                if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
                    event.preventDefault();
                    shortcut.action();
                    break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [shortcuts, enabled]);
}

// Predefined shortcuts that can be used across the app
export const GLOBAL_SHORTCUTS = {
    START_PAUSE_TIMER: {
        key: ' ',
        description: 'Start/Pause timer',
    },
    RESET_TIMER: {
        key: 'r',
        description: 'Reset timer',
    },
    SKIP_SESSION: {
        key: 's',
        description: 'Skip current session',
    },
    NEW_TASK: {
        key: 'n',
        description: 'Focus new task input',
    },
    TOGGLE_THEME: {
        key: 't',
        ctrlKey: true,
        description: 'Toggle dark mode',
    },
    SHOW_SHORTCUTS: {
        key: '?',
        shiftKey: true,
        description: 'Show keyboard shortcuts',
    },
    GO_TO_STATS: {
        key: '1',
        ctrlKey: true,
        description: 'Go to Statistics',
    },
    GO_TO_SETTINGS: {
        key: '2',
        ctrlKey: true,
        description: 'Go to Settings',
    },
    GO_TO_HOME: {
        key: '0',
        ctrlKey: true,
        description: 'Go to Home',
    },
};