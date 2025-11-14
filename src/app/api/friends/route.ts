import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        const { data, error } = await supabase
            .from('friends')
            .select(`
        id,
        sender_id,
        receiver_id,
        status,
        created_at,
        sender:profiles!friends_sender_id_fkey (
            username,
            avatar_url
        ),
        receiver:profiles!friends_receiver_id_fkey (
            username,
            avatar_url
        )
      `)
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

        if (error) {
            console.error('Error fetching friends:', error);
            return NextResponse.json({ error: 'Failed to fetch friends' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in friends API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        const { receiver_id } = await request.json();

        if (!receiver_id) {
            return NextResponse.json({ error: 'Receiver ID is required' }, { status: 400 });
        }

        // Validate that receiver_id is a valid UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(receiver_id)) {
            return NextResponse.json({ error: 'Invalid receiver ID format' }, { status: 400 });
        }

        if (receiver_id === userId) {
            return NextResponse.json({ error: 'Cannot send friend request to yourself' }, { status: 400 });
        }

        // Check if request already exists
        const { data: existing } = await supabase
            .from('friends')
            .select('id')
            .or(`and(sender_id.eq.${userId},receiver_id.eq.${receiver_id}),and(sender_id.eq.${receiver_id},receiver_id.eq.${userId})`)
            .single();

        if (existing) {
            return NextResponse.json({ error: 'Friend request already exists' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('friends')
            .insert({
                sender_id: userId,
                receiver_id,
                status: 'pending'
            })
            .select()
            .single();

        if (error) {
            console.error('Error sending friend request:', error);
            return NextResponse.json({ error: 'Failed to send friend request' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in friends POST API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}