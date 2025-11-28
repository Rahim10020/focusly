/**
 * @fileoverview User preferences API route.
 *
 * Provides endpoints for managing user preferences such as theme settings.
 * Uses upsert to create or update preferences as needed.
 *
 * Route: /api/user/preferences
 */

import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { supabaseServerPool } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { Cache } from '@/lib/cache';

/**
 * User preferences request body.
 * @typedef {Object} PreferencesRequest
 * @property {'light' | 'dark'} theme - The theme preference to set
 */

/**
 * Successful preferences update response.
 * @typedef {Object} PreferencesSuccessResponse
 * @property {boolean} success - Always true on success
 */

/**
 * Updates the user's theme preference.
 *
 * Creates a new preference record if one doesn't exist, or updates the
 * existing record. Requires authentication.
 *
 * @param {Request} request - The incoming request object
 * @returns {Promise<NextResponse>} JSON response indicating success or failure
 *
 * @example
 * // Set theme to dark mode
 * // POST /api/user/preferences
 * // Request body:
 * {
 *   "theme": "dark"
 * }
 *
 * @example
 * // Set theme to light mode
 * // POST /api/user/preferences
 * // Request body:
 * {
 *   "theme": "light"
 * }
 *
 * @example
 * // Successful response (200 OK)
 * {
 *   "success": true
 * }
 *
 * @example
 * // Error responses
 * // 400: { "error": "Invalid theme value. Must be \"light\" or \"dark\"." }
 * // 401: { "error": "Unauthorized" }
 * // 500: { "error": "Failed to update preferences" }
 */
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    try {
        const { theme } = await request.json();

        if (theme !== 'light' && theme !== 'dark') {
            return new NextResponse(
                JSON.stringify({ error: 'Invalid theme value. Must be "light" or "dark".' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Use pooled server-side admin client with strict user validation
        const supabaseAdmin = supabaseServerPool.getAdminClient();

        // Double-check: only update for authenticated user (never trust client input)
        const { error } = await supabaseAdmin
            .from('user_preferences')
            .upsert(
                {
                    user_id: session.user.id, // Use session user ID, not request body
                    theme_preference: theme,
                    updated_at: new Date().toISOString()
                },
                { onConflict: 'user_id' }
            );

        if (error) {
            logger.error('Error updating theme preference', error as Error, {
                action: 'updateThemePreference',
                userId: session.user.id
            });
            throw error;
        }

        // Invalidate cache for this user's preferences
        await Cache.invalidate(`theme-preference:${session.user.id}`);

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('Error in preferences API', error as Error, {
            action: 'preferencesAPI'
        });
        return new NextResponse(
            JSON.stringify({ error: 'Failed to update preferences' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
