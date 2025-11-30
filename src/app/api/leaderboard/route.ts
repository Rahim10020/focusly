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
import { supabaseServerPool } from '@/lib/supabase/server';
import { Database } from '@/lib/supabase/database.types';
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
    page: z.string()
        .optional()
        .transform(val => val ? parseInt(val, 10) : 1)
        .refine(val => val >= 1 && val <= 1000, {
            message: 'Page must be between 1 and 1000'
        }),
    limit: z.string()
        .optional()
        .transform(val => val ? parseInt(val, 10) : 10)
        .refine(val => val >= 1 && val <= 100, {
            message: 'Limit must be between 1 and 100'
        }),
    timeFilter: z.enum(['all', 'month', 'week']).optional().default('all'),
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
            limit: searchParams.get('limit'),
            timeFilter: searchParams.get('timeFilter')
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

        const { page, limit, timeFilter } = validationResult.data;

        // S'assurer que page * limit ne dépasse pas un seuil
        if (page * limit > 10000) {
            return NextResponse.json({
                error: 'Pagination offset too large'
            }, { status: 400 });
        }

        const offset = (page - 1) * limit;

        const cacheKey = `leaderboard:${page}:${limit}:${timeFilter}`;

        const result = await Cache.getOrSet(cacheKey, async () => {
            // Use pooled server admin client for better performance
            const supabaseAdmin = supabaseServerPool.getAdminClient();

            // Calculate date threshold for time filtering
            let dateThreshold: string | null = null;
            if (timeFilter === 'week') {
                const weekStart = new Date();
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                weekStart.setHours(0, 0, 0, 0);
                dateThreshold = weekStart.toISOString();
            } else if (timeFilter === 'month') {
                const monthStart = new Date();
                monthStart.setDate(1);
                monthStart.setHours(0, 0, 0, 0);
                dateThreshold = monthStart.toISOString();
            }

            // 1. Get total count
            const { count: totalCount, error: countError } = await supabaseAdmin
                .from('stats')
                .select('*', { count: 'exact', head: true });

            if (countError) {
                logger.error('Error fetching count', countError as Error, {
                    action: 'leaderboardGetCount'
                });
                throw new Error('Failed to fetch leaderboard count');
            }

            // 2. Fetch stats with pagination
            const { data: statsData, error: statsError } = await supabaseAdmin
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

            // 3. Fetch profiles
            const { data: profilesData, error: profilesError } = await supabaseAdmin
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

            // 4. Create missing profiles (using admin client)
            const usersWithStats = new Set(typedStatsData.map(stat => stat.user_id));
            const usersWithProfiles = new Set(typedProfilesData.map(profile => profile.id));
            const usersWithoutProfiles = Array.from(usersWithStats).filter(id => !usersWithProfiles.has(id));

            if (usersWithoutProfiles.length > 0) {
                const profilesToCreate = usersWithoutProfiles.map(id => ({
                    id,
                    username: null,
                    avatar_url: null
                }));

                // Check existing profiles to avoid conflicts
                const { data: existingProfiles } = await supabaseAdmin
                    .from('profiles')
                    .select('id')
                    .in('id', profilesToCreate.map((p: { id: string }) => p.id));

                const existingIds = new Set(existingProfiles?.map((p: { id: string }) => p.id) || []);
                const profilesToInsert = profilesToCreate.filter((p: { id: string }) => !existingIds.has(p.id));

                if (profilesToInsert.length > 0) {
                    const { error: createError } = await (supabaseAdmin
                        .from('profiles') as any)
                        .insert(profilesToInsert);

                    if (createError) {
                        logger.error('Error creating missing profiles', createError as Error, {
                            action: 'createMissingProfiles',
                            userIds: usersWithoutProfiles
                        });
                        // Continue without profiles for these users
                    } else {
                        // Add created profiles to the array
                        profilesToInsert.forEach(profile => {
                            typedProfilesData.push(profile as Database['public']['Tables']['profiles']['Row']);
                        });
                    }
                }
            }

            // 5. Create a map of user_id -> profile for quick lookup
            const profilesMap = new Map(
                typedProfilesData.map(profile => [profile.id, profile])
            );

            // 6. Transform data to match expected structure
            const transformedData = typedStatsData.map(stat => {
                const profile = profilesMap.get(stat.user_id);
                return {
                    id: profile?.id || stat.user_id,
                    // ✅ CORRECTION: Fallback avec un username généré
                    username: profile?.username || `User ${stat.user_id.slice(0, 8)}`,
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