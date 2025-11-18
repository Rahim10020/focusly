import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Database } from '@/lib/supabase';
import { withRateLimit } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';

// Validation schema for userId parameter
const UserIdSchema = z.string().uuid('Invalid user ID format');

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