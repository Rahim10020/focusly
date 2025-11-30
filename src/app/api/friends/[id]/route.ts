/**
 * @fileoverview Individual friend request operations API route.
 *
 * Provides endpoints for managing a specific friend request by ID,
 * including accepting or rejecting pending requests.
 *
 * Route: /api/friends/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { compose, withErrorHandling, withLogging, withRateLimit, withValidation } from '@/lib/api/middleware';
import { UpdateFriendRequestSchema } from '@/lib/api/schemas';
import { successResponse, Errors } from '@/lib/api/utils/response';

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
async function putHandler(
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
    validatedData: any
) {
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.accessToken) {
        return Errors.unauthorized();
    }

    const userId = session.user.id;
    const { id: friendId } = await context.params;
    const { action } = validatedData;

    // Create supabase client with user's access token for RLS
    const supabaseWithAuth = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`
                }
            }
        }
    );

    // Check if the user is the receiver of this friend request
    const { data: friendRequestData, error: fetchError } = await supabaseWithAuth
        .from('friends')
        .select('sender_id, receiver_id, status')
        .eq('id', friendId)
        .single();

    if (fetchError || !friendRequestData) {
        return Errors.notFound('Friend request not found');
    }

    const typedFriendRequestData = friendRequestData as { receiver_id: string; status: 'pending' | 'accepted' | 'rejected'; sender_id: string };

    if (typedFriendRequestData.receiver_id !== userId) {
        return Errors.forbidden('Unauthorized to modify this request');
    }

    if (typedFriendRequestData.status !== 'pending') {
        return Errors.badRequest('Request already processed');
    }

    // 1. Update friendship status
    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    const { error: updateError } = await supabaseWithAuth
        .from('friends')
        .update({ status: newStatus })
        .eq('id', friendId);

    if (updateError) {
        logger.error('Error updating friend request', updateError as Error, {
            action: 'updateFriendRequest',
            friendId
        });
        throw new Error('Failed to update friend request');
    }

    // 2. Delete original friend request notification
    const { error: deleteNotifError } = await supabaseWithAuth
        .from('notifications')
        .delete()
        .eq('type', 'friend_request')
        .eq('data->friendshipId', friendId);

    if (deleteNotifError) {
        logger.error('Error deleting friend request notification', deleteNotifError as Error, {
            action: 'deleteFriendRequestNotification',
            friendId
        });
        // Continue anyway - this is not critical
    }

    // 3. Create acceptance notification for sender if accepted
    if (action === 'accept') {
        const { error: notifError } = await supabaseWithAuth
            .from('notifications')
            .insert({
                user_id: typedFriendRequestData.sender_id,
                type: 'friend_request_accepted',
                title: 'Friend Request Accepted',
                message: `${session.user.name || session.user.email} accepted your friend request`,
                data: { friendshipId: friendId }
            });

        if (notifError) {
            logger.error('Error creating friend accept notification', notifError as Error, {
                action: 'createFriendAcceptNotification',
                friendId
            });
            // Continue anyway - this is not critical
        }
    }

    logger.info(`Friend request ${action}ed`, {
        action: `${action}FriendRequest`,
        friendId,
        senderId: typedFriendRequestData.sender_id,
        receiverId: userId
    });

    return successResponse({ message: `Friend request ${action}ed` });
}

/**
 * Deletes (removes) a friendship.
 *
 * Either user in the friendship can delete it. This permanently removes
 * the friendship record from the database.
 *
 * @param {NextRequest} request - The incoming request object
 * @param {Object} context - Route context
 * @param {Promise<{id: string}>} context.params - Route parameters containing the friendship ID
 * @returns {Promise<NextResponse>} JSON response confirming deletion
 *
 * @example
 * // Delete a friendship
 * // DELETE /api/friends/friendship-uuid
 *
 * @example
 * // Successful response (200 OK)
 * {
 *   "message": "Friend removed successfully"
 * }
 *
 * @example
 * // Error responses
 * // 401: { "error": "Unauthorized" }
 * // 403: { "error": "Unauthorized to remove this friendship" }
 * // 404: { "error": "Friendship not found" }
 */
async function deleteHandler(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.accessToken) {
        return Errors.unauthorized();
    }

    const userId = session.user.id;
    const { id: friendshipId } = await context.params;

    // Create supabase client with user's access token for RLS
    const supabaseWithAuth = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`
                }
            }
        }
    );

    // Check if the user is part of this friendship
    const { data: friendshipData, error: fetchError } = await supabaseWithAuth
        .from('friends')
        .select('sender_id, receiver_id, status')
        .eq('id', friendshipId)
        .single();

    if (fetchError || !friendshipData) {
        return Errors.notFound('Friendship not found');
    }

    // Verify user is either sender or receiver
    if (friendshipData.sender_id !== userId && friendshipData.receiver_id !== userId) {
        return Errors.forbidden('Unauthorized to remove this friendship');
    }

    // Delete the friendship
    const { error: deleteError } = await supabaseWithAuth
        .from('friends')
        .delete()
        .eq('id', friendshipId);

    if (deleteError) {
        logger.error('Error deleting friendship', deleteError as Error, {
            action: 'deleteFriendship',
            friendshipId
        });
        throw new Error('Failed to remove friend');
    }

    logger.info('Friendship removed', {
        action: 'removeFriend',
        friendshipId,
        userId
    });

    return successResponse({ message: 'Friend removed successfully' });
}

export const PUT = compose(
    withErrorHandling(),
    withLogging(),
    withValidation(UpdateFriendRequestSchema),
    withRateLimit('standard')
)(putHandler);

export const DELETE = compose(
    withErrorHandling(),
    withLogging(),
    withRateLimit('standard')
)(deleteHandler);