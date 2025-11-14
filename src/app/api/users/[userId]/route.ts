import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;

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
    } catch (error) {
        console.error('Error in user API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}