/**
 * @fileoverview LocalStorage wrapper hook with SSR support.
 * Provides a useState-like API for persisting state to localStorage
 * with automatic JSON serialization and error handling.
 */

import { useState, useCallback } from 'react';

/**
 * Hook for persisting state to localStorage.
 * Provides a useState-like API with automatic persistence.
 * Handles SSR by checking for window availability.
 *
 * @template T - Type of the stored value
 * @param {string} key - LocalStorage key for the value
 * @param {T} initialValue - Default value if key doesn't exist
 * @returns {[T, (value: T | ((val: T) => T)) => void]} Tuple of current value and setter function
 *
 * @example
 * // Simple value storage
 * const [theme, setTheme] = useLocalStorage('theme', 'dark');
 *
 * // Object storage
 * const [settings, setSettings] = useLocalStorage('settings', {
 *   notifications: true,
 *   sound: false
 * });
 *
 * // Update with function
 * setSettings(prev => ({ ...prev, sound: true }));
 *
 * // Array storage
 * const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', []);
 * setTasks(prev => [...prev, newTask]);
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') {
            return initialValue;
        }
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.log(error);
            return initialValue;
        }
    });

    const setValue = useCallback((value: T | ((val: T) => T)) => {
        try {
            setStoredValue(prevStoredValue => {
                const valueToStore = value instanceof Function ? value(prevStoredValue) : value;
                if (typeof window !== 'undefined') {
                    window.localStorage.setItem(key, JSON.stringify(valueToStore));
                }
                return valueToStore;
            });
        } catch (error) {
            console.log(error);
        }
    }, [key]);

    return [storedValue, setValue] as const;
}