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
import { compose, withErrorHandling, withLogging, withRateLimit, withValidation } from '@/lib/api/middleware';
import { UpdateNotificationSchema } from '@/lib/api/schemas';
import { successResponse, Errors } from '@/lib/api/utils/response';

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
    const { id: notificationId } = await context.params;
    const { read } = validatedData;

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
        return Errors.notFound('Notification not found');
    }

    if (notification.user_id !== userId) {
        return Errors.forbidden('Unauthorized to modify this notification');
    }

    const { data, error } = await supabaseWithAuth
        .from('notifications')
        .update({ read })
        .eq('id', notificationId)
        .select()
        .single();

    if (error) {
        throw new Error('Failed to update notification');
    }

    return successResponse(data);
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
async function deleteHandler(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.accessToken) {
        return Errors.unauthorized();
    }

    const userId = session.user.id;
    const { id: notificationId } = await context.params;

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
        return Errors.notFound('Notification not found');
    }

    if (notification.user_id !== userId) {
        return Errors.forbidden('Unauthorized to delete this notification');
    }

    const { error } = await supabaseWithAuth
        .from('notifications')
        .delete()
        .eq('id', notificationId);

    if (error) {
        throw new Error('Failed to delete notification');
    }

    return successResponse({ message: 'Notification deleted successfully' });
}

export const PUT = compose(
    withErrorHandling(),
    withLogging(),
    withValidation(UpdateNotificationSchema),
    withRateLimit('standard')
)(putHandler);

export const DELETE = compose(
    withErrorHandling(),
    withLogging(),
    withRateLimit('standard')
)(deleteHandler);