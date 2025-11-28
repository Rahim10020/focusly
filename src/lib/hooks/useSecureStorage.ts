/**
 * @fileoverview Secure storage hook for sensitive data.
 * Uses sessionStorage instead of localStorage for better security.
 * Session data is cleared when the browser/tab is closed.
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Secure storage hook that uses sessionStorage instead of localStorage
 * for sensitive authentication data. Data is automatically cleared when
 * the browser session ends.
 * 
 * @template T - Type of the stored value
 * @param {string} key - Storage key
 * @param {T} initialValue - Initial value if nothing is stored
 * @returns {[T, (value: T | ((val: T) => T)) => void]} Tuple of [value, setValue]
 * 
 * @example
 * const [token, setToken] = useSecureStorage('auth_token', null);
 */
export function useSecureStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
    const [storedValue, setStoredValue] = useState<T>(initialValue);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        try {
            const item = window.sessionStorage.getItem(key);
            if (item) {
                setStoredValue(JSON.parse(item));
            }
        } catch (error) {
            console.error(`Error loading ${key} from sessionStorage:`, error);
        }
    }, [key]);

    const setValue = useCallback((value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);

            if (isClient) {
                if (valueToStore === null || valueToStore === undefined) {
                    window.sessionStorage.removeItem(key);
                } else {
                    window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
                }
            }
        } catch (error) {
            console.error(`Error saving ${key} to sessionStorage:`, error);
        }
    }, [key, isClient, storedValue]);

    return [storedValue, setValue];
}
