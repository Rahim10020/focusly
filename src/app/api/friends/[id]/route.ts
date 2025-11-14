import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const friendId = params.id;
        const { action } = await request.json(); // 'accept' or 'reject'

        if (!['accept', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Check if the user is the receiver of this friend request
        const { data: friendRequest, error: fetchError } = await supabase
            .from('friends')
            .select('receiver_id, status')
            .eq('id', friendId)
            .single();

        if (fetchError || !friendRequest) {
            return NextResponse.json({ error: 'Friend request not found' }, { status: 404 });
        }

        if (friendRequest.receiver_id !== userId) {
            return NextResponse.json({ error: 'Unauthorized to modify this request' }, { status: 403 });
        }

        if (friendRequest.status !== 'pending') {
            return NextResponse.json({ error: 'Request already processed' }, { status: 400 });
        }

        const newStatus = action === 'accept' ? 'accepted' : 'rejected';

        const { data, error } = await supabase
            .from('friends')
            .update({ status: newStatus })
            .eq('id', friendId)
            .select()
            .single();

        if (error) {
            console.error('Error updating friend request:', error);
            return NextResponse.json({ error: 'Failed to update friend request' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in friends PUT API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}