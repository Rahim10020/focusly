import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

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

                        const { data: userData, error } = await supabase
                            .from('users')
                            .select('theme_preference')
                            .eq('id', token.id)
                            .single();

                        if (!error && userData?.theme_preference) {
                            session.user.themePreference = userData.theme_preference;
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