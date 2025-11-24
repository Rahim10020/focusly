/**
 * @fileoverview NextAuth.js configuration for authentication.
 * Configures credentials-based authentication with Supabase as the backend.
 * Handles JWT token management, refresh, and session callbacks.
 * @module lib/auth
 */

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

/**
 * NextAuth.js configuration options.
 * Defines authentication providers, session strategy, and callbacks.
 *
 * @type {NextAuthOptions}
 *
 * @property {Array} providers - Authentication providers (Credentials with Supabase)
 * @property {Object} session - Session configuration using JWT strategy
 * @property {Object} callbacks - JWT and session callbacks for token management
 * @property {Object} pages - Custom authentication pages
 *
 * @example
 * // Usage in API route
 * import { authOptions } from '@/lib/auth';
 * import NextAuth from 'next-auth';
 * export default NextAuth(authOptions);
 */
export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const supabase = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                );

                try {
                    const { data, error } = await supabase.auth.signInWithPassword({
                        email: credentials.email,
                        password: credentials.password,
                    });

                    if (error) {
                        logger.error('Auth error', error as Error, {
                            action: 'signIn',
                            email: credentials.email
                        });
                        return null;
                    }

                    return {
                        id: data.user.id,
                        email: data.user.email,
                        name: data.user.user_metadata?.name || data.user.email,
                        accessToken: data.session?.access_token,
                        refreshToken: data.session?.refresh_token,
                    };
                } catch (error) {
                    logger.error('Auth error', error as Error, {
                        action: 'authorize',
                        email: credentials.email
                    });
                    return null;
                }
            }
        })
    ],
    session: {
        strategy: 'jwt',
    },
    callbacks: {
        async jwt({ token, user, trigger }) {
            if (user) {
                token.id = user.id;
                token.accessToken = user.accessToken;
                token.refreshToken = user.refreshToken;
                token.expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
            }

            // Check if token needs refresh
            const now = Date.now();
            const expiresAt = (token.expiresAt as number) || 0;

            // If token is about to expire in the next 5 minutes, refresh it
            if (expiresAt - now < 5 * 60 * 1000 && token.refreshToken) {
                try {
                    const supabase = createClient(
                        process.env.NEXT_PUBLIC_SUPABASE_URL!,
                        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                    );

                    const { data, error } = await supabase.auth.refreshSession({
                        refresh_token: token.refreshToken as string,
                    });

                    if (!error && data.session) {
                        token.accessToken = data.session.access_token;
                        token.refreshToken = data.session.refresh_token;
                        token.expiresAt = Date.now() + 60 * 60 * 1000;
                    }
                } catch (error) {
                    logger.error('Token refresh error', error as Error, {
                        action: 'refreshToken'
                    });
                    // Continue with existing token
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.accessToken = token.accessToken;
                session.refreshToken = token.refreshToken;

                // Récupérer la préférence de thème depuis la base de données
                if (token.id) {
                    try {
                        const supabase = createClient(
                            process.env.NEXT_PUBLIC_SUPABASE_URL!,
                            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                            {
                                global: {
                                    headers: {
                                        'Authorization': `Bearer ${token.accessToken}`
                                    }
                                }
                            }
                        );

                        // Ensure profile exists
                        const { data: profileData, error: profileError } = await supabase
                            .from('profiles')
                            .select('id')
                            .eq('id', token.id)
                            .single();

                        if (profileError && profileError.code === 'PGRST116') { // Not found
                            // Create profile
                            await supabase
                                .from('profiles')
                                .insert({
                                    id: token.id,
                                    username: null,
                                    avatar_url: null
                                });
                        }

                        const { data: userData, error } = await supabase
                            .from('profiles')
                            .select('username, avatar_url')
                            .eq('id', token.id)
                            .single();

                        if (!error && userData) {
                            session.user.name = userData.username || session.user.name;
                            session.user.image = userData.avatar_url || session.user.image;
                        }
                    } catch (error) {
                        console.error('Error fetching user theme preference:', error);
                    }
                }
            }
            return session;
        },
    },
    pages: {
        signIn: '/auth/signin',
    },
};