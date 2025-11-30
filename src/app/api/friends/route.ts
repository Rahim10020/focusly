/**
 * @fileoverview Friends management API route.
 *
 * Provides endpoints for managing friend relationships including:
 * - Fetching the authenticated user's friends list
 * - Sending new friend requests
 *
 * All endpoints require authentication and are rate-limited.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { compose, withRateLimit, withValidation, withLogging, withErrorHandling } from '@/lib/api/middleware';
import { CreateFriendRequestSchema } from '@/lib/api/schemas';
import { successResponse, Errors } from '@/lib/api/utils/response';

/**
 * Friend relationship data returned from the API.
 * @typedef {Object} FriendData
 * @property {string} id - Unique friendship ID
 * @property {string} sender_id - ID of the user who sent the request
 * @property {string} receiver_id - ID of the user who received the request
 * @property {'pending' | 'accepted' | 'rejected'} status - Current friendship status
 * @property {string} created_at - ISO timestamp of when the request was created
 * @property {Object} sender - Sender's profile information
 * @property {string} sender.username - Sender's username
 * @property {string|null} sender.avatar_url - Sender's avatar URL
 * @property {Object} receiver - Receiver's profile information
 * @property {string} receiver.username - Receiver's username
 * @property {string|null} receiver.avatar_url - Receiver's avatar URL
 */

/**
 * Retrieves all friend relationships for the authenticated user.
 *
 * Returns both sent and received friend requests with profile information
 * for the other party in each relationship.
 *
 * @param {NextRequest} request - The incoming request object
 * @returns {Promise<NextResponse>} JSON response containing array of friend relationships
 *
 * @example
 * // Successful response
 * // GET /api/friends
 * // Response: 200 OK
 * [
 *   {
 *     "id": "uuid",
 *     "sender_id": "user-uuid-1",
 *     "receiver_id": "user-uuid-2",
 *     "status": "accepted",
 *     "created_at": "2024-01-15T10:30:00Z",
 *     "sender": { "username": "alice", "avatar_url": "https://..." },
 *     "receiver": { "username": "bob", "avatar_url": null }
 *   }
 * ]
 *
 * @example
 * // Unauthorized response
 * // Response: 401 Unauthorized
 * { "error": "Unauthorized" }
 */
async function getHandler(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.accessToken) {
        return Errors.unauthorized();
    }

    const userId = session.user.id;

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

    const { data, error } = await supabaseWithAuth
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
        throw new Error('Failed to fetch friends');
    }

    return successResponse(data || []);
}

/**
 * Sends a new friend request to another user.
 *
 * Creates a pending friend request from the authenticated user to the
 * specified receiver. Validates that the receiver exists and that no
 * existing relationship exists between the users.
 *
 * @param {NextRequest} request - The incoming request object
 * @returns {Promise<NextResponse>} JSON response containing the created friend request
 *
 * @example
 * // Request body
 * // POST /api/friends
 * {
 *   "receiver_id": "uuid-of-user-to-add"
 * }
 *
 * @example
 * // Successful response (201 Created)
 * {
 *   "id": "new-friendship-uuid",
 *   "sender_id": "current-user-uuid",
 *   "receiver_id": "receiver-uuid",
 *   "status": "pending",
 *   "created_at": "2024-01-15T10:30:00Z"
 * }
 *
 * @example
 * // Error responses
 * // 400: { "error": "Receiver ID is required" }
 * // 400: { "error": "Invalid receiver ID format" }
 * // 400: { "error": "Cannot send friend request to yourself" }
 * // 400: { "error": "Friend request already exists" }
 * // 401: { "error": "Unauthorized" }
 */
async function postHandler(request: NextRequest, context: any, validatedData: any) {
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.accessToken) {
        return Errors.unauthorized();
    }

    const userId = session.user.id;
    const { receiver_id } = validatedData;

    if (receiver_id === userId) {
        return Errors.badRequest('Cannot send friend request to yourself');
    }

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

    // Ensure sender has a profile
    const { data: senderProfile } = await supabaseWithAuth
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

    if (!senderProfile) {
        // Create profile if it doesn't exist
        const { error: profileError } = await supabaseWithAuth
            .from('profiles')
            .insert({
                id: userId,
                username: null,
                avatar_url: null
            });

        if (profileError) {
            throw new Error('Failed to create user profile');
        }
    }

    // Check if receiver has a profile
    const { data: receiverProfile } = await supabaseWithAuth
        .from('profiles')
        .select('id')
        .eq('id', receiver_id)
        .single();

    if (!receiverProfile) {
        return Errors.badRequest('Cannot send friend request to this user');
    }

    // Check if request already exists
    const { data: existing } = await supabaseWithAuth
        .from('friends')
        .select('id')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${receiver_id}),and(sender_id.eq.${receiver_id},receiver_id.eq.${userId})`)
        .single();

    if (existing) {
        return Errors.badRequest('Friend request already exists');
    }

    const { data, error } = await supabaseWithAuth
        .from('friends')
        .insert({
            sender_id: userId,
            receiver_id,
            status: 'pending' // ✅ CRUCIAL: status pending
        })
        .select(`
                *,
                sender:profiles!friends_sender_id_fkey (
                    username
                ),
                receiver:profiles!friends_receiver_id_fkey (
                    username
                )
            `)
        .single();

    if (error) {
        throw new Error('Failed to send friend request');
    }

    // Create notification for the receiver
    try {
        const senderName = data.sender?.username || 'Someone';
        await supabaseWithAuth
            .from('notifications')
            .insert({
                user_id: receiver_id,
                type: 'friend_request',
                title: 'New Friend Request',
                message: `${senderName} sent you a friend request`,
                data: { friend_request_id: data.id },
                read: false
            });
    } catch (notificationError) {
        // Don't fail the friend request if notification creation fails
    }

    return successResponse(data, { status: 201 });
}

export const GET = compose(
    withErrorHandling(),
    withLogging(),
    withRateLimit('generous')
)(getHandler);

export const POST = compose(
    withErrorHandling(),
    withLogging(),
    withValidation(CreateFriendRequestSchema),
    withRateLimit('standard')
)(postHandler);