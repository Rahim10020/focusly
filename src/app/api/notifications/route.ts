/**
 * @fileoverview Notifications API route.
 *
 * Provides endpoints for managing user notifications including:
 * - Fetching user notifications
 * - Creating notifications
 *
 * All endpoints require authentication and are rate-limited.
 */

import {
  compose,
  withRateLimit,
  withValidation,
  withLogging,
  withErrorHandling,
  withAuthRequired,
} from "@/lib/api/middleware";
import { CreateNotificationSchema } from "@/lib/api/schemas";
import { successResponse, Errors } from "@/lib/api/utils/response";
import { getUserSupabaseClient } from "@/lib/api/supabase";
import type { AuthContext } from "@/lib/api/middleware/auth";
import type { Json } from "@/lib/supabase/database.types";

/**
 * Retrieves all notifications for the authenticated user.
 *
 * Returns notifications ordered by creation date (newest first).
 *
 * @param {NextRequest} request - The incoming request object
 * @param {unknown} context - Route context
 * @param {unknown} validatedData - Validated request data
 * @param {AuthContext} auth - Authenticated user context
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
async function getHandler(
  _request: any,
  _context: unknown,
  _validatedData: unknown,
  auth: AuthContext,
) {
  const supabase = getUserSupabaseClient(auth);

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch notifications");
  }

  return successResponse(data || []);
}

/**
 * Creates a new notification for a user.
 *
 * @param {NextRequest} request - The incoming request object
 * @param {unknown} context - Route context
 * @param {unknown} validatedData - Validated notification schema
 * @param {AuthContext} auth - Authenticated user context
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
async function postHandler(
  _request: any,
  _context: unknown,
  validatedData: unknown,
  auth: AuthContext,
) {
  const parsedData = CreateNotificationSchema.parse(validatedData);
  const { user_id, type, title, message, data } = parsedData;

  const supabase = getUserSupabaseClient(auth);

  const { data: notification, error } = await supabase
    .from("notifications")
    .insert({
      user_id,
      type,
      title,
      message,
      data: (data as Json) || null,
      read: false,
    })
    .select()
    .single();

  if (error) {
    throw new Error("Failed to create notification");
  }

  return successResponse(notification, { status: 201 });
}

export const GET = compose(
  withErrorHandling(),
  withAuthRequired(),
  withLogging(),
  withRateLimit("generous"),
)(getHandler);

export const POST = compose(
  withErrorHandling(),
  withValidation(CreateNotificationSchema),
  withAuthRequired(),
  withLogging(),
  withRateLimit("standard"),
)(postHandler);
