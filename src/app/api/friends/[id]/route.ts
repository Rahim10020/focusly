/**
 * @fileoverview Individual friend request operations API route.
 *
 * Provides endpoints for managing a specific friend request by ID,
 * including accepting or rejecting pending requests.
 *
 * Route: /api/friends/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

/**
 * Updated friend request data.
 * @typedef {Object} UpdatedFriendRequest
 * @property {string} id - Friendship ID
 * @property {string} sender_id - ID of the user who sent the request
 * @property {string} receiver_id - ID of the user who received the request
 * @property {'accepted' | 'rejected'} status - Updated friendship status
 * @property {string} created_at - ISO timestamp of creation
 */

/**
 * Accepts or rejects a pending friend request.
 *
 * Only the receiver of a friend request can accept or reject it.
 * The request must be in 'pending' status to be modified.
 *
 * @param {NextRequest} request - The incoming request object
 * @param {Object} context - Route context
 * @param {Promise<{id: string}>} context.params - Route parameters containing the friend request ID
 * @returns {Promise<NextResponse>} JSON response containing the updated friend request
 *
 * @example
 * // Accept a friend request
 * // PUT /api/friends/friendship-uuid
 * // Request body:
 * {
 *   "action": "accept"
 * }
 *
 * @example
 * // Reject a friend request
 * // PUT /api/friends/friendship-uuid
 * // Request body:
 * {
 *   "action": "reject"
 * }
 *
 * @example
 * // Successful response (200 OK)
 * {
 *   "id": "friendship-uuid",
 *   "sender_id": "sender-uuid",
 *   "receiver_id": "current-user-uuid",
 *   "status": "accepted",
 *   "created_at": "2024-01-15T10:30:00Z"
 * }
 *
 * @example
 * // Error responses
 * // 400: { "error": "Invalid action" }
 * // 400: { "error": "Request already processed" }
 * // 401: { "error": "Unauthorized" }
 * // 403: { "error": "Unauthorized to modify this request" }
 * // 404: { "error": "Friend request not found" }
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const { id: friendId } = await params;
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

        const friendData = friendRequest as { receiver_id: string; status: string };

        if (friendData.receiver_id !== userId) {
            return NextResponse.json({ error: 'Unauthorized to modify this request' }, { status: 403 });
        }

        if (friendData.status !== 'pending') {
            return NextResponse.json({ error: 'Request already processed' }, { status: 400 });
        }

        const newStatus = action === 'accept' ? 'accepted' : 'rejected';

        const { data, error } = await (supabase
            .from('friends') as any)
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