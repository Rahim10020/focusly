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
import { supabaseServerPool } from '@/lib/supabase/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Database } from '@/lib/supabase/database.types';
import { compose, withErrorHandling, withLogging, withRateLimit } from '@/lib/api/middleware';
import { successResponse, Errors } from '@/lib/api/utils/response';
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

async function getHandler(
    request: NextRequest,
    context: { params: Promise<{ userId: string }> }
) {
    const { userId } = await context.params;

    // Validate userId format (UUID)
    const validationResult = UserIdSchema.safeParse(userId);
    if (!validationResult.success) {
        logger.warn('Invalid user ID format', {
            action: 'userIdValidation',
            userId,
            errors: validationResult.error.format()
        });
        return Errors.badRequest('Invalid user ID format');
    }

    const session = await getServerSession(authOptions);
    const viewerId = session?.user?.id;

    const supabaseAdmin = supabaseServerPool.getAdminClient();

    // If viewing own profile, show all stats
    if (viewerId === userId) {
        const { data: profileData, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, username, avatar_url')
            .eq('id', userId)
            .single();

        const { data: statsData, error: statsError } = await supabaseAdmin
            .from('stats')
            .select('total_sessions, completed_tasks, total_tasks, streak, total_focus_time, longest_streak, tasks_completed_today')
            .eq('user_id', userId)
            .single();

        if (profileError || !profileData) {
            logger.error('Error fetching user profile', profileError as Error, {
                action: 'getUserProfileOwn',
                userId
            });
            return Errors.notFound('User not found');
        }

        if (statsError) {
            logger.error('Error fetching user stats', statsError as Error, {
                action: 'getUserStatsOwn',
                userId
            });
            return Errors.notFound('User stats not found');
        }

        const data = { ...(profileData as any), stats: statsData };
        return successResponse({ ...data, isFriend: true }); // Own profile, consider as friend
    }

    // Check if viewer is a friend
    const { data: friendship } = await supabaseAdmin
        .from('friends')
        .select('id')
        .or(`and(sender_id.eq.${viewerId},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${viewerId})`)
        .eq('status', 'accepted')
        .single();

    const isFriend = !!friendship;

    // Get visibility settings
    const { data: visibilitySettings } = await supabaseAdmin
        .from('stat_visibility')
        .select('stat_field, visible_to_friends')
        .eq('user_id', userId);

    const typedVisibilitySettings = (visibilitySettings || []) as Database['public']['Tables']['stat_visibility']['Row'][];

    const visibilityMap = new Map(
        typedVisibilitySettings.map(setting => [setting.stat_field, setting.visible_to_friends])
    );

    // Get profile and stats
    const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', userId)
        .single();

    const { data: statsData, error: statsError } = await supabaseAdmin
        .from('stats')
        .select('total_sessions, completed_tasks, total_tasks, streak, total_focus_time, longest_streak, tasks_completed_today')
        .eq('user_id', userId)
        .single();

    if (profileError || !profileData) {
        logger.error('Error fetching user profile', profileError as Error, {
            action: 'getUserProfile',
            userId,
            viewerId
        });
        return Errors.notFound('User not found');
    }

    if (statsError) {
        logger.error('Error fetching user stats', statsError as Error, {
            action: 'getUserStats',
            userId,
            viewerId
        });
        return Errors.notFound('User stats not found');
    }

    const userData = { ...(profileData as any), stats: statsData } as { id: string; username: string | null; avatar_url: string | null; stats: Record<string, any> | null };

    // Filter stats based on visibility
    if (userData.stats && !isFriend) {
        const filteredStats: Record<string, any> = {};
        for (const [key, value] of Object.entries(userData.stats)) {
            const visible = visibilityMap.get(key) ?? true; // Default to visible
            if (visible) {
                filteredStats[key] = value;
            }
            // Don't add the key if not visible (better security - doesn't reveal which fields exist)
        }
        userData.stats = filteredStats;
    }

    return successResponse({ ...userData, isFriend });
}

export const GET = compose(
    withErrorHandling(),
    withLogging(),
    withRateLimit('generous')
)(getHandler);