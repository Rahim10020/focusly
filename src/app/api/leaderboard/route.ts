import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/supabase';
import { withRateLimit } from '@/lib/rateLimit';

async function getHandler(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        // Get total count for pagination
        const { count: totalCount, error: countError } = await supabase
            .from('stats')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('Error fetching count:', countError);
            return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
        }

        // First, get all stats ordered by total_focus_time with pagination
        const { data: statsData, error: statsError } = await supabase
            .from('stats')
            .select('user_id, total_sessions, completed_tasks, total_tasks, streak, total_focus_time, longest_streak')
            .order('total_focus_time', { ascending: false })
            .range(offset, offset + limit - 1);

        if (statsError) {
            console.error('Error fetching stats:', statsError);
            return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
        }

        if (!statsData || statsData.length === 0) {
            return NextResponse.json({
                data: [],
                pagination: {
                    page,
                    limit,
                    total: totalCount || 0,
                    totalPages: Math.ceil((totalCount || 0) / limit)
                }
            });
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
            console.error('Error fetching profiles:', profilesError);
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

        return NextResponse.json({
            data: transformedData,
            pagination: {
                page,
                limit,
                total: totalCount || 0,
                totalPages: Math.ceil((totalCount || 0) / limit)
            }
        });
    } catch (error) {
        console.error('Error in leaderboard API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export const GET = withRateLimit(getHandler, { windowMs: 60 * 1000, maxRequests: 30 }); // 30 requests per minute