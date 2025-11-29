/**
 * @fileoverview Theme provider component for managing light/dark mode.
 * Provides theme context and toggle functionality throughout the application.
 */

'use client';

import { createContext, useContext } from 'react';
import { useTheme as useNextTheme } from '@/hooks/useTheme';

/**
 * Available theme options.
 * @typedef {'light' | 'dark'} Theme
 */
type Theme = 'light' | 'dark';

/**
 * Theme context value type.
 * @typedef {Object} ThemeContextType
 * @property {Theme} theme - Current active theme
 * @property {() => void} toggleTheme - Function to toggle between light and dark themes
 * @property {boolean} mounted - Whether the component has mounted (for hydration safety)
 */
type ThemeContextType = {
    theme: Theme;
    toggleTheme: () => void;
    mounted: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Theme provider component that manages application-wide theme state.
 * Defaults to light mode and provides theme toggle functionality.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to wrap with theme context
 * @returns {JSX.Element} The wrapped children with theme context
 *
 * @example
 * // Wrap your app with ThemeProvider
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { theme, toggleTheme, mounted } = useNextTheme();

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, mounted }}>
            {children}
        </ThemeContext.Provider>
    );
}

/**
 * Custom hook to access theme context.
 * Must be used within a ThemeProvider component.
 *
 * @returns {ThemeContextType} The theme context value
 * @throws {Error} When used outside of ThemeProvider
 *
 * @example
 * function MyComponent() {
 *   const { theme, toggleTheme, mounted } = useTheme();
 *
 *   if (!mounted) return null;
 *
 *   return (
 *     <button onClick={toggleTheme}>
 *       Current theme: {theme}
 *     </button>
 *   );
 * }
 */
export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
