import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        // First, get all stats ordered by total_focus_time
        const { data: statsData, error: statsError } = await supabase
            .from('stats')
            .select('user_id, total_sessions, completed_tasks, total_tasks, streak, total_focus_time, longest_streak')
            .order('total_focus_time', { ascending: false })
            .limit(50);

        if (statsError) {
            console.error('Error fetching stats:', statsError);
            return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
        }

        if (!statsData || statsData.length === 0) {
            return NextResponse.json([]);
        }

        // Get all user IDs from stats
        const userIds = statsData.map(stat => stat.user_id);

        // Fetch profiles for these users
        const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .in('id', userIds);

        if (profilesError) {
            console.error('Error fetching profiles:', profilesError);
            // Continue even if profiles fetch fails, we'll use defaults
        }

        // Create a map of user_id -> profile for quick lookup
        const profilesMap = new Map(
            (profilesData || []).map(profile => [profile.id, profile])
        );

        // Transform data to match expected structure
        const transformedData = statsData.map(stat => {
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

        return NextResponse.json(transformedData);
    } catch (error) {
        console.error('Error in leaderboard API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}