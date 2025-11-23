/**
 * @fileoverview User profile and statistics API route.
 *
 * Provides an endpoint to fetch a user's profile and statistics.
 * Supports privacy controls based on friendship status and visibility settings.
 *
 * Route: /api/users/[userId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Database } from '@/lib/supabase';
import { withRateLimit } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';

/**
 * User profile with statistics.
 * @typedef {Object} UserProfile
 * @property {string} id - User ID
 * @property {string} username - User's display name
 * @property {string|null} avatar_url - User's avatar URL
 * @property {Object|null} stats - User's statistics (may be filtered based on visibility)
 * @property {number} [stats.total_sessions] - Total number of focus sessions
 * @property {number} [stats.completed_tasks] - Number of completed tasks
 * @property {number} [stats.total_tasks] - Total number of tasks
 * @property {number} [stats.streak] - Current streak count
 * @property {number} [stats.total_focus_time] - Total focus time in minutes
 * @property {number} [stats.longest_streak] - Longest streak achieved
 * @property {number} [stats.tasks_completed_today] - Tasks completed today
 */

// Validation schema for userId parameter
const UserIdSchema = z.string().uuid('Invalid user ID format');

/**
 * Retrieves a user's profile and statistics.
 *
 * Returns different levels of data based on the viewer's relationship:
 * - Own profile: Full statistics
 * - Friend's profile: All statistics (friendship verified)
 * - Other user's profile: Filtered based on visibility settings
 *
 * Rate limited to 30 requests per minute.
 *
 * @param {NextRequest} request - The incoming request object
 * @param {Object} context - Route context
 * @param {Promise<{userId: string}>} context.params - Route parameters containing the target user ID
 * @returns {Promise<NextResponse>} JSON response containing user profile and statistics
 *
 * @example
 * // Fetch user profile
 * // GET /api/users/user-uuid-here
 *
 * @example
 * // Successful response for own profile (200 OK)
 * {
 *   "id": "user-uuid",
 *   "username": "myusername",
 *   "avatar_url": "https://...",
 *   "stats": {
 *     "total_sessions": 50,
 *     "completed_tasks": 120,
 *     "total_tasks": 150,
 *     "streak": 7,
 *     "total_focus_time": 3000,
 *     "longest_streak": 14,
 *     "tasks_completed_today": 5
 *   }
 * }
 *
 * @example
 * // Response for non-friend with restricted visibility
 * {
 *   "id": "user-uuid",
 *   "username": "otherusername",
 *   "avatar_url": null,
 *   "stats": {
 *     "total_sessions": 50,
 *     "streak": 7
 *   }
 * }
 *
 * @example
 * // Error responses
 * // 400: { "error": "Invalid user ID format" }
 * // 404: { "error": "User not found" }
 * // 500: { "error": "Internal server error" }
 */
async function getHandler(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;

        // Validate userId format (UUID)
        const validationResult = UserIdSchema.safeParse(userId);
        if (!validationResult.success) {
            logger.warn('Invalid user ID format', {
                action: 'userIdValidation',
                userId,
                errors: validationResult.error.format()
            });
            return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
        }

        const session = await getServerSession(authOptions);
        const viewerId = session?.user?.id;

        // If viewing own profile, show all stats
        if (viewerId === userId) {
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                id,
                username,
                avatar_url,
                stats (
                  total_sessions,
                  completed_tasks,
                  total_tasks,
                  streak,
                  total_focus_time,
                  longest_streak,
                  tasks_completed_today
                )
              `)
                .eq('id', userId)
                .single();

            if (error) {
                logger.error('Error fetching user stats', error as Error, {
                    action: 'getUserStatsOwn',
                    userId
                });
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }

            return NextResponse.json(data);
        }

        // Check if viewer is a friend
        const { data: friendship } = await supabase
            .from('friends')
            .select('id')
            .or(`and(sender_id.eq.${viewerId},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${viewerId})`)
            .eq('status', 'accepted')
            .single();

        const isFriend = !!friendship;

        // Get visibility settings
        const { data: visibilitySettings } = await supabase
            .from('stat_visibility')
            .select('stat_field, visible_to_friends')
            .eq('user_id', userId);

        const typedVisibilitySettings = (visibilitySettings || []) as Database['public']['Tables']['stat_visibility']['Row'][];

        const visibilityMap = new Map(
            typedVisibilitySettings.map(setting => [setting.stat_field, setting.visible_to_friends])
        );

        // Get profile and stats
        const { data, error } = await supabase
            .from('profiles')
            .select(`
            id,
            username,
            avatar_url,
            stats (
              total_sessions,
              completed_tasks,
              total_tasks,
              streak,
              total_focus_time,
              longest_streak,
              tasks_completed_today
            )
          `)
            .eq('id', userId)
            .single();

        if (error) {
            logger.error('Error fetching user stats', error as Error, {
                action: 'getUserStats',
                userId,
                viewerId
            });
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Filter stats based on visibility
        if (data.stats && !isFriend) {
            const filteredStats: Record<string, any> = {};
            for (const [key, value] of Object.entries(data.stats)) {
                const visible = visibilityMap.get(key) ?? true; // Default to visible
                if (visible) {
                    filteredStats[key] = value;
                }
                // Don't add the key if not visible (better security - doesn't reveal which fields exist)
            }
            data.stats = filteredStats as any;
        }

        return NextResponse.json(data);
    } catch (error) {
        logger.error('Error in user API', error as Error, {
            action: 'userAPI'
        });
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export const GET = withRateLimit(getHandler, { windowMs: 60 * 1000, maxRequests: 30 }); // 30 requests per minute