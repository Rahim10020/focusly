/**
 * @fileoverview NextAuth.js type declarations and module augmentation.
 * Extends the default NextAuth types to include custom user properties
 * and session data specific to the Focusly application.
 * @module types/next-auth
 */

import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
    /**
     * Extended User interface for NextAuth.
     * Includes additional properties for authentication tokens and user preferences.
     * @interface User
     */
    interface User {
        /** Unique identifier for the user */
        id: string;
        /** User's email address */
        email?: string | null;
        /** User's display name */
        name?: string | null;
        /** URL to user's profile image */
        image?: string | null;
        /** JWT access token for API authentication */
        accessToken?: string;
        /** Refresh token for obtaining new access tokens */
        refreshToken?: string;
        /** User's preferred theme setting */
        themePreference?: 'light' | 'dark';
    }

    /**
     * Extended Session interface for NextAuth.
     * Contains user information and authentication tokens available during a session.
     * @interface Session
     */
    interface Session {
        /** User information available in the session */
        user: {
            /** Unique identifier for the user */
            id: string;
            /** User's email address */
            email?: string | null;
            /** User's display name */
            name?: string | null;
            /** URL to user's profile image */
            image?: string | null;
            /** User's preferred theme setting */
            themePreference?: 'light' | 'dark';
        };
        /** JWT access token for API authentication */
        accessToken?: string;
        /** Refresh token for obtaining new access tokens */
        refreshToken?: string;
    }
}

declare module 'next-auth/jwt' {
    /**
     * Extended JWT interface for NextAuth.
     * Contains token data stored in the JWT cookie.
     * @interface JWT
     */
    interface JWT {
        /** User's unique identifier stored in the token */
        id?: string;
        /** JWT access token for API authentication */
        accessToken?: string;
        /** Refresh token for obtaining new access tokens */
        refreshToken?: string;
    }
}
