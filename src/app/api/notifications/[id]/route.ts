/**
 * @fileoverview Individual notification operations API route.
 *
 * Provides endpoints for managing a specific notification by ID,
 * including marking as read and deleting notifications.
 *
 * Route: /api/notifications/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

/**
 * Marks a notification as read.
 *
 * @param {NextRequest} request - The incoming request object
 * @param {Object} context - Route context
 * @param {Promise<{id: string}>} context.params - Route parameters containing the notification ID
 * @returns {Promise<NextResponse>} JSON response containing the updated notification
 *
 * @example
 * // Mark notification as read
 * // PUT /api/notifications/notification-uuid
 * // Request body:
 * {
 *   "read": true
 * }
 *
 * @example
 * // Successful response (200 OK)
 * {
 *   "id": "notification-uuid",
 *   "user_id": "user-uuid",
 *   "type": "friend_request",
 *   "title": "New Friend Request",
 *   "message": "John Doe sent you a friend request",
 *   "data": { "friend_request_id": "request-uuid" },
 *   "read": true,
 *   "created_at": "2024-01-15T10:30:00Z",
 *   "updated_at": "2024-01-15T10:35:00Z"
 * }
 *
 * @example
 * // Error responses
 * // 401: { "error": "Unauthorized" }
 * // 403: { "error": "Unauthorized to modify this notification" }
 * // 404: { "error": "Notification not found" }
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !session.accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        const { id: notificationId } = await params;
        const { read } = await request.json();

        if (typeof read !== 'boolean') {
            return NextResponse.json({ error: 'Read status must be a boolean' }, { status: 400 });
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

        // Check if the notification belongs to the user
        const { data: notification, error: fetchError } = await supabaseWithAuth
            .from('notifications')
            .select('user_id')
            .eq('id', notificationId)
            .single();

        if (fetchError || !notification) {
            return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
        }

        if (notification.user_id !== userId) {
            return NextResponse.json({ error: 'Unauthorized to modify this notification' }, { status: 403 });
        }

        const { data, error } = await supabaseWithAuth
            .from('notifications')
            .update({ read })
            .eq('id', notificationId)
            .select()
            .single();

        if (error) {
            console.error('Error updating notification:', error);
            return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in notifications PUT API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * Deletes a notification.
 *
 * @param {NextRequest} request - The incoming request object
 * @param {Object} context - Route context
 * @param {Promise<{id: string}>} context.params - Route parameters containing the notification ID
 * @returns {Promise<NextResponse>} JSON response confirming deletion
 *
 * @example
 * // Delete notification
 * // DELETE /api/notifications/notification-uuid
 * // Response: 200 OK
 * { "message": "Notification deleted successfully" }
 *
 * @example
 * // Error responses
 * // 401: { "error": "Unauthorized" }
 * // 403: { "error": "Unauthorized to delete this notification" }
 * // 404: { "error": "Notification not found" }
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !session.accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        const { id: notificationId } = await params;

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

        // Check if the notification belongs to the user
        const { data: notification, error: fetchError } = await supabaseWithAuth
            .from('notifications')
            .select('user_id')
            .eq('id', notificationId)
            .single();

        if (fetchError || !notification) {
            return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
        }

        if (notification.user_id !== userId) {
            return NextResponse.json({ error: 'Unauthorized to delete this notification' }, { status: 403 });
        }

        const { error } = await supabaseWithAuth
            .from('notifications')
            .delete()
            .eq('id', notificationId);

        if (error) {
            console.error('Error deleting notification:', error);
            return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Error in notifications DELETE API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}