/**
 * @fileoverview User preferences API route.
 *
 * Provides endpoints for managing user preferences such as theme settings.
 * Uses upsert to create or update preferences as needed.
 *
 * Route: /api/user/preferences
 */

import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { supabaseServerPool } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { Cache } from '@/lib/cache';
import { compose, withRateLimit, withValidation, withLogging, withErrorHandling } from '@/lib/api/middleware';
import { UpdateUserPreferencesSchema } from '@/lib/api/schemas';
import { successResponse, Errors } from '@/lib/api/utils/response';

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
async function postHandler(request: NextRequest, context: any, validatedData: any) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return Errors.unauthorized();
    }

    try {
        // Use pooled server-side admin client with strict user validation
        const supabaseAdmin = supabaseServerPool.getAdminClient();

        // Get current preferences to merge with updates
        const { data: currentPrefs, error: fetchError } = await supabaseAdmin
            .from('user_preferences')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            logger.error('Error fetching current preferences', fetchError as Error, {
                action: 'postHandler - fetchPreferences',
                userId: session.user.id,
                errorCode: fetchError.code,
                errorMessage: fetchError.message
            });
        }

        // Merge validated data with current preferences
        const updatedPrefs = {
            ...(currentPrefs || {}),
            ...validatedData,
            user_id: session.user.id, // Use session user ID, not request body
            updated_at: new Date().toISOString()
        };

        const { error: upsertError } = await (supabaseAdmin
            .from('user_preferences') as any)
            .upsert(updatedPrefs, { onConflict: 'user_id' });

        if (upsertError) {
            logger.error('Error upserting user preferences', upsertError as Error, {
                action: 'postHandler - upsert',
                userId: session.user.id,
                errorCode: (upsertError as any)?.code,
                errorMessage: (upsertError as any)?.message,
                data: JSON.stringify(updatedPrefs)
            });
            throw new Error(`Failed to update preferences: ${upsertError.message}`);
        }

        // Invalidate cache for this user's preferences
        await Cache.invalidate(`theme-preference:${session.user.id}`);
        await Cache.invalidate(`user-preferences:${session.user.id}`);

        return successResponse({ success: true });
    } catch (error) {
        logger.error('Error in preferences handler', error as Error, {
            action: 'postHandler',
            userId: session?.user?.id,
            errorMessage: (error as any)?.message
        });
        throw error;
    }
}

export const POST = compose(
    withErrorHandling(),
    withLogging(),
    withValidation(UpdateUserPreferencesSchema),
    withRateLimit('standard')
)(postHandler);
