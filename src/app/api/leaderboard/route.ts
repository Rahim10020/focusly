/**
 * @fileoverview Leaderboard API route for fetching user rankings.
 *
 * Provides a paginated endpoint to retrieve user statistics ranked by
 * total focus time. Results are cached for 10 minutes to improve performance.
 *
 * Route: /api/leaderboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/supabase';
import { withRateLimit } from '@/lib/rateLimit';
import { Cache } from '@/lib/cache';
import { logger } from '@/lib/logger';

/**
 * Leaderboard entry containing user profile and statistics.
 * @typedef {Object} LeaderboardEntry
 * @property {string} id - User ID
 * @property {string} username - User's display name
 * @property {string|null} avatar_url - User's avatar URL
 * @property {Object} stats - User's statistics
 * @property {number} stats.total_sessions - Total number of focus sessions
 * @property {number} stats.completed_tasks - Number of completed tasks
 * @property {number} stats.total_tasks - Total number of tasks
 * @property {number} stats.streak - Current streak count
 * @property {number} stats.total_focus_time - Total focus time in minutes
 * @property {number} stats.longest_streak - Longest streak achieved
 */

/**
 * Paginated leaderboard response.
 * @typedef {Object} LeaderboardResponse
 * @property {LeaderboardEntry[]} data - Array of leaderboard entries
 * @property {Object} pagination - Pagination metadata
 * @property {number} pagination.page - Current page number
 * @property {number} pagination.limit - Items per page
 * @property {number} pagination.total - Total number of entries
 * @property {number} pagination.totalPages - Total number of pages
 */

// Validation schema for query parameters
const LeaderboardQuerySchema = z.object({
    page: z.string().optional().transform(val => parseInt(val || '1')).pipe(z.number().min(1).max(1000)),
    limit: z.string().optional().transform(val => parseInt(val || '20')).pipe(z.number().min(1).max(100))
});

/**
 * Retrieves the paginated leaderboard ranked by total focus time.
 *
 * Users are ranked in descending order by their total focus time.
 * Results are cached for 10 minutes to reduce database load.
 * Rate limited to 30 requests per minute.
 *
 * @param {NextRequest} request - The incoming request object
 * @returns {Promise<NextResponse>} JSON response containing leaderboard data with pagination
 *
 * @example
 * // Basic request
 * // GET /api/leaderboard
 *
 * @example
 * // Request with pagination
 * // GET /api/leaderboard?page=2&limit=10
 *
 * @example
 * // Successful response (200 OK)
 * {
 *   "data": [
 *     {
 *       "id": "user-uuid",
 *       "username": "topuser",
 *       "avatar_url": "https://...",
 *       "stats": {
 *         "total_sessions": 150,
 *         "completed_tasks": 320,
 *         "total_tasks": 400,
 *         "streak": 15,
 *         "total_focus_time": 12500,
 *         "longest_streak": 30
 *       }
 *     }
 *   ],
 *   "pagination": {
 *     "page": 1,
 *     "limit": 20,
 *     "total": 100,
 *     "totalPages": 5
 *   }
 * }
 *
 * @example
 * // Error responses
 * // 400: { "error": "Invalid query parameters", "details": {...} }
 * // 500: { "error": "Internal server error" }
 */
async function getHandler(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Validate query parameters
        const validationResult = LeaderboardQuerySchema.safeParse({
            page: searchParams.get('page'),
            limit: searchParams.get('limit')
        });

        if (!validationResult.success) {
            logger.warn('Invalid leaderboard query parameters', {
                action: 'leaderboardValidation',
                errors: validationResult.error.format()
            });
            return NextResponse.json({
                error: 'Invalid query parameters',
                details: validationResult.error.format()
            }, { status: 400 });
        }

        const { page, limit } = validationResult.data;
        const offset = (page - 1) * limit;

        const cacheKey = `leaderboard:${page}:${limit}`;

        const result = await Cache.getOrSet(cacheKey, async () => {
            // Get total count for pagination
            const { count: totalCount, error: countError } = await supabase
                .from('stats')
                .select('*', { count: 'exact', head: true });

            if (countError) {
                logger.error('Error fetching count', countError as Error, {
                    action: 'leaderboardGetCount'
                });
                throw new Error('Failed to fetch leaderboard count');
            }

            // First, get all stats ordered by total_focus_time with pagination
            const { data: statsData, error: statsError } = await supabase
                .from('stats')
                .select('user_id, total_sessions, completed_tasks, total_tasks, streak, total_focus_time, longest_streak')
                .order('total_focus_time', { ascending: false })
                .range(offset, offset + limit - 1);

            if (statsError) {
                logger.error('Error fetching stats', statsError as Error, {
                    action: 'leaderboardGetStats'
                });
                throw new Error('Failed to fetch leaderboard stats');
            }

            if (!statsData || statsData.length === 0) {
                return {
                    data: [],
                    pagination: {
                        page,
                        limit,
                        total: totalCount || 0,
                        totalPages: Math.ceil((totalCount || 0) / limit)
                    }
                };
            }

            const typedStatsData = statsData as Database['public']['Tables']['stats']['Row'][];

            // Get all user IDs from stats
            const userIds = typedStatsData.map(stat => stat.user_id);

            // Fetch profiles for these users
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, username, avatar_url')
                .in('id', userIds);

            if (profilesError) {
                logger.error('Error fetching profiles', profilesError as Error, {
                    action: 'leaderboardGetProfiles'
                });
                // Continue even if profiles fetch fails, we'll use defaults
            }

            const typedProfilesData = (profilesData || []) as Database['public']['Tables']['profiles']['Row'][];

            // Create a map of user_id -> profile for quick lookup
            const profilesMap = new Map(
                typedProfilesData.map(profile => [profile.id, profile])
            );

            // Transform data to match expected structure
            const transformedData = typedStatsData.map(stat => {
                const profile = profilesMap.get(stat.user_id);
                return {
                    id: profile?.id || stat.user_id,
                    username: profile?.username || 'Anonymous',
                    avatar_url: profile?.avatar_url || null,
                    stats: {
                        total_sessions: stat.total_sessions,
                        completed_tasks: stat.completed_tasks,
                        total_tasks: stat.total_tasks,
                        streak: stat.streak,
                        total_focus_time: stat.total_focus_time,
                        longest_streak: stat.longest_streak,
                    }
                };
            });

            return {
                data: transformedData,
                pagination: {
                    page,
                    limit,
                    total: totalCount || 0,
                    totalPages: Math.ceil((totalCount || 0) / limit)
                }
            };
        }, { ttl: 10 * 60 * 1000 }); // Cache for 10 minutes

        return NextResponse.json(result);
    } catch (error) {
        logger.error('Error in leaderboard API', error as Error, {
            action: 'leaderboardAPI'
        });
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export const GET = withRateLimit(getHandler, { windowMs: 60 * 1000, maxRequests: 30 }); // 30 requests per minute