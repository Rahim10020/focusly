import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Database } from '@/lib/supabase';
import { withRateLimit } from '@/lib/rateLimit';

async function getHandler(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;

        // Validate userId format (UUID)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(userId)) {
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
            console.error('Error fetching user stats:', error);
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
        console.error('Error in user API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export const GET = withRateLimit(getHandler, { windowMs: 60 * 1000, maxRequests: 30 }); // 30 requests per minute