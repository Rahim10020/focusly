/**
 * @fileoverview Individual notification operations API route.
 *
 * Provides endpoints for managing a specific notification by ID,
 * including marking as read and deleting notifications.
 *
 * Route: /api/notifications/[id]
 */

import {
  compose,
  withErrorHandling,
  withLogging,
  withRateLimit,
  withValidation,
  withAuthRequired,
} from "@/lib/api/middleware";
import { UpdateNotificationSchema } from "@/lib/api/schemas";
import { successResponse, Errors } from "@/lib/api/utils/response";
import { getUserSupabaseClient } from "@/lib/api/supabase";
import type { AuthContext } from "@/lib/api/middleware/auth";

/**
 * Marks a notification as read.
 *
 * @param {NextRequest} request - The incoming request object
 * @param {Object} context - Route context
 * @param {Promise<{id: string}>} context.params - Route parameters containing the notification ID
 * @param {unknown} validatedData - Validated notification update schema
 * @param {AuthContext} auth - Authenticated user context
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
  _request: any,
  context: unknown,
  validatedData: unknown,
  auth: AuthContext,
) {
  const parsedData = UpdateNotificationSchema.parse(validatedData);
  const routeContext = context as { params: Promise<{ id: string }> };
  const { id: notificationId } = await routeContext.params;
  const { read } = parsedData;

  const supabase = getUserSupabaseClient(auth);

  // Check if the notification belongs to the user
  const { data: notification, error: fetchError } = await supabase
    .from("notifications")
    .select("user_id")
    .eq("id", notificationId)
    .single();

  if (fetchError || !notification) {
    return Errors.notFound("Notification not found");
  }

  if (notification.user_id !== auth.userId) {
    return Errors.forbidden("Unauthorized to modify this notification");
  }

  const { data, error } = await supabase
    .from("notifications")
    .update({ read })
    .eq("id", notificationId)
    .select()
    .single();

  if (error) {
    throw new Error("Failed to update notification");
  }

  return successResponse(data);
}

/**
 * Deletes a notification.
 *
 * @param {NextRequest} request - The incoming request object
 * @param {Object} context - Route context
 * @param {Promise<{id: string}>} context.params - Route parameters containing the notification ID
 * @param {unknown} validatedData - Validated request data
 * @param {AuthContext} auth - Authenticated user context
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
  _request: any,
  context: unknown,
  _validatedData: unknown,
  auth: AuthContext,
) {
  const routeContext = context as { params: Promise<{ id: string }> };
  const { id: notificationId } = await routeContext.params;

  const supabase = getUserSupabaseClient(auth);

  // Check if the notification belongs to the user
  const { data: notification, error: fetchError } = await supabase
    .from("notifications")
    .select("user_id")
    .eq("id", notificationId)
    .single();

  if (fetchError || !notification) {
    return Errors.notFound("Notification not found");
  }

  if (notification.user_id !== auth.userId) {
    return Errors.forbidden("Unauthorized to delete this notification");
  }

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId);

  if (error) {
    throw new Error("Failed to delete notification");
  }

  return successResponse({ message: "Notification deleted successfully" });
}

export const PUT = compose(
  withErrorHandling(),
  withValidation(UpdateNotificationSchema),
  withAuthRequired(),
  withLogging(),
  withRateLimit("standard"),
)(putHandler);

export const DELETE = compose(
  withErrorHandling(),
  withAuthRequired(),
  withLogging(),
  withRateLimit("standard"),
)(deleteHandler);
