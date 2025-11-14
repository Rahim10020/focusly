import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;
        const session = await getServerSession(authOptions);
        const viewerId = (session?.user as any)?.id;

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
                console.error('Error fetching user stats:', error);
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

        const visibilityMap = new Map(
            visibilitySettings?.map(setting => [setting.stat_field, setting.visible_to_friends]) || []
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
            console.error('Error fetching user stats:', error);
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Filter stats based on visibility
        if (data.stats && !isFriend) {
            const filteredStats: any = {};
            for (const [key, value] of Object.entries(data.stats)) {
                const visible = visibilityMap.get(key) ?? true; // Default to visible
                if (visible) {
                    filteredStats[key] = value;
                } else {
                    filteredStats[key] = null; // Hide the stat
                }
            }
            data.stats = filteredStats;
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in user API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}