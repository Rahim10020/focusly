/**
 * @fileoverview Session provider component that wraps Next-Auth session management.
 * Provides authentication context to the entire application.
 */

'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

/**
 * Props for the SessionProvider component.
 * @interface SessionProviderProps
 * @property {ReactNode} children - Child components to wrap with session context
 */
interface SessionProviderProps {
    children: ReactNode;
}

/**
 * Session provider component that wraps the application with Next-Auth session context.
 * Enables authentication state to be accessible throughout the component tree.
 *
 * @param {SessionProviderProps} props - Component props
 * @param {ReactNode} props.children - Child components to wrap
 * @returns {JSX.Element} The wrapped children with session context
 *
 * @example
 * // Wrap your app with SessionProvider
 * <SessionProvider>
 *   <App />
 * </SessionProvider>
 *
 * @example
 * // Access session in child components
 * function ChildComponent() {
 *   const { data: session } = useSession();
 *   return <div>{session?.user?.name}</div>;
 * }
 */
export function SessionProvider({ children }: SessionProviderProps) {
    return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}