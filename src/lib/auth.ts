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
                        name: data.user.user_metadata?.username || data.user.email,
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

            const now = Date.now();
            const expiresAt = (token.expiresAt as number) || 0;
            const tokenId = token.id as string;

            // Refresh si expire dans 5 minutes
            if (expiresAt - now < 5 * 60 * 1000 && token.refreshToken) {
                // Vérifier si un refresh est déjà en cours pour ce token
                if (refreshingTokens.has(tokenId)) {
                    try {
                        // Attendre le refresh en cours
                        const refreshedToken = await refreshingTokens.get(tokenId);
                        return refreshedToken || token;
                    } catch {
                        return token;
                    }
                }

                // Créer une nouvelle promise de refresh
                const refreshPromise = (async () => {
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
                            
                            logger.info('Token refreshed successfully', {
                                action: 'tokenRefresh',
                                userId: token.id
                            });
                        } else {
                            logger.error('Token refresh failed', error as Error, {
                                action: 'tokenRefresh',
                                userId: token.id
                            });
                        }

                        return token;
                    } finally {
                        // Cleanup après refresh
                        refreshingTokens.delete(tokenId);
                    }
                })();

                refreshingTokens.set(tokenId, refreshPromise);
                return refreshPromise;
            }

            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.accessToken = token.accessToken;
                session.refreshToken = token.refreshToken;

                // Récupérer les préférences via une route API sécurisée
                if (token.id) {
                    try {
                        // Utiliser uniquement ANON_KEY côté client
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

                        // Fetch avec RLS activé (au lieu de service_role)
                        const { data: prefData } = await supabase
                            .from('user_preferences')
                            .select('theme_preference')
                            .eq('user_id', token.id)
                            .single();

                        session.user.theme = prefData?.theme_preference || 'light';
                    } catch (error) {
                        console.error('Error fetching theme preference:', error);
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

// Ajouter un simple flag de refresh en mémoire
const refreshingTokens = new Map<string, Promise<any>>();