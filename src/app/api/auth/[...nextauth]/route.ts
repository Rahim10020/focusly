/**
 * @fileoverview NextAuth.js authentication API route handler.
 *
 * This catch-all route handles all authentication-related requests including:
 * - OAuth provider callbacks (Google, GitHub, etc.)
 * - Session management
 * - Sign in/sign out operations
 * - CSRF token generation
 *
 * @see {@link https://next-auth.js.org/getting-started/rest-api} NextAuth REST API
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * NextAuth handler that processes all authentication requests.
 *
 * @description Handles various authentication endpoints:
 * - GET /api/auth/signin - Sign in page
 * - GET /api/auth/signout - Sign out page
 * - GET /api/auth/session - Get session data
 * - GET /api/auth/csrf - Get CSRF token
 * - GET /api/auth/providers - List available providers
 * - GET /api/auth/callback/:provider - OAuth callback
 * - POST /api/auth/signin/:provider - Initiate sign in
 * - POST /api/auth/signout - Process sign out
 * - POST /api/auth/callback/:provider - Process OAuth callback
 *
 * @example
 * // Get current session
 * fetch('/api/auth/session')
 *   .then(res => res.json())
 *   .then(session => console.log(session));
 *
 * @example
 * // Sign out
 * fetch('/api/auth/signout', { method: 'POST' });
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };