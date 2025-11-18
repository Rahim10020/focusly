import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabase';

/**
 * Hook to handle Supabase authentication session synchronization
 * Automatically sets the Supabase session when the user logs in
 *
 * @returns Object with userId and authentication status
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
