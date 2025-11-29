/**
 * @fileoverview Supabase authentication synchronization hook.
 * Handles automatic synchronization between NextAuth session
 * and Supabase authentication state for seamless database access.
 */

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { supabaseClient as supabase } from '@/lib/supabase/client';

/**
 * Hook for synchronizing NextAuth session with Supabase authentication.
 * Automatically sets Supabase auth tokens when the user logs in,
 * enabling Row Level Security (RLS) policies in the database.
 *
 * @returns {Object} Authentication state and utilities
 * @returns {Function} returns.getUserId - Function to get current user ID
 * @returns {string|undefined} returns.userId - Current user ID
 * @returns {boolean} returns.isAuthenticated - Whether user is authenticated
 * @returns {Object} returns.session - Full NextAuth session object
 *
 * @example
 * const { userId, isAuthenticated, getUserId } = useSupabaseSync();
 *
 * // Check authentication before database operations
 * if (isAuthenticated) {
 *   const { data } = await supabase
 *     .from('tasks')
 *     .select('*')
 *     .eq('user_id', userId);
 * }
 *
 * // Use in conditional rendering
 * {isAuthenticated ? (
 *   <UserDashboard />
 * ) : (
 *   <LoginPrompt />
 * )}
 */
export function useSupabaseSync() {
    const { data: session } = useSession();

    // Set Supabase auth session when user logs in
    useEffect(() => {
        if (session?.accessToken && session?.refreshToken) {
            supabase.auth.setSession({
                access_token: session.accessToken,
                refresh_token: session.refreshToken,
            });
        }
    }, [session?.accessToken, session?.refreshToken]);

    const getUserId = () => session?.user?.id;
    const isAuthenticated = !!session?.user?.id;

    return {
        getUserId,
        userId: session?.user?.id,
        isAuthenticated,
        session,
    };
}
