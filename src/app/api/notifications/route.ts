/**
 * @fileoverview Notifications API route.
 *
 * Provides endpoints for managing user notifications including:
 * - Fetching user notifications
 * - Marking notifications as read
 * - Deleting notifications
 *
 * All endpoints require authentication and are rate-limited.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { withRateLimit } from '@/lib/rateLimit';

/**
 * Notification data returned from the API.
 * @typedef {Object} NotificationData
 * @property {string} id - Unique notification ID
 * @property {string} user_id - ID of the user who owns the notification
 * @property {'friend_request' | 'friend_request_accepted' | 'task_completed' | 'task_overdue' | 'achievement' | 'info'} type - Notification type
 * @property {string} title - Notification title
 * @property {string} message - Notification message
 * @property {Object|null} data - Additional notification data
 * @property {boolean} read - Whether the notification has been read
 * @property {string} created_at - ISO timestamp of creation
 * @property {string} updated_at - ISO timestamp of last update
 */

/**
 * Retrieves all notifications for the authenticated user.
 *
 * Returns notifications ordered by creation date (newest first).
 *
 * @param {NextRequest} request - The incoming request object
 * @returns {Promise<NextResponse>} JSON response containing array of notifications
 *
 * @example
 * // Successful response
 * // GET /api/notifications
 * // Response: 200 OK
 * [
 *   {
 *     "id": "uuid",
 *     "user_id": "user-uuid",
 *     "type": "friend_request",
 *     "title": "New Friend Request",
 *     "message": "John Doe sent you a friend request",
 *     "data": { "friend_request_id": "request-uuid" },
 *     "read": false,
 *     "created_at": "2024-01-15T10:30:00Z",
 *     "updated_at": "2024-01-15T10:30:00Z"
 *   }
 * ]
 *
 * @example
 * // Unauthorized response
 * // Response: 401 Unauthorized
 * { "error": "Unauthorized" }
 */
async function getHandler(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !session.accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching notifications:', error);
            return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in notifications API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * Creates a new notification for a user.
 *
 * @param {NextRequest} request - The incoming request object
 * @returns {Promise<NextResponse>} JSON response containing the created notification
 *
 * @example
 * // Request body
 * // POST /api/notifications
 * {
 *   "user_id": "target-user-uuid",
 *   "type": "friend_request",
 *   "title": "New Friend Request",
 *   "message": "John Doe sent you a friend request",
 *   "data": { "friend_request_id": "request-uuid" }
 * }
 *
 * @example
 * // Successful response (201 Created)
 * {
 *   "id": "new-notification-uuid",
 *   "user_id": "target-user-uuid",
 *   "type": "friend_request",
 *   "title": "New Friend Request",
 *   "message": "John Doe sent you a friend request",
 *   "data": { "friend_request_id": "request-uuid" },
 *   "read": false,
 *   "created_at": "2024-01-15T10:30:00Z",
 *   "updated_at": "2024-01-15T10:30:00Z"
 * }
 */
async function postHandler(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !session.accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { user_id, type, title, message, data } = await request.json();

        if (!user_id || !type || !title || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate notification type
        const validTypes = ['friend_request', 'friend_request_accepted', 'task_completed', 'task_overdue', 'achievement', 'info'];
        if (!validTypes.includes(type)) {
            return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
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

        const { data: notification, error } = await supabaseWithAuth
            .from('notifications')
            .insert({
                user_id,
                type,
                title,
                message,
                data: data || null,
                read: false
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating notification:', error);
            return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
        }

        return NextResponse.json(notification, { status: 201 });
    } catch (error) {
        console.error('Error in notifications POST API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export const GET = withRateLimit(getHandler, { windowMs: 60 * 1000, maxRequests: 30 }); // 30 requests per minute
export const POST = withRateLimit(postHandler, { windowMs: 60 * 1000, maxRequests: 10 }); // 10 requests per minute for creating notifications