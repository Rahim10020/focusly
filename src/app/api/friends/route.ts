/**
 * @fileoverview Friends management API route.
 *
 * Provides endpoints for managing friend relationships including:
 * - Fetching the authenticated user's friends list
 * - Sending new friend requests
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
import { CreateFriendRequestSchema } from "@/lib/api/schemas";
import { successResponse, Errors } from "@/lib/api/utils/response";
import { FriendService } from "@/lib/domain/services/FriendService";
import type { AuthContext } from "@/lib/api/middleware/auth";

/**
 * Retrieves all friend relationships for the authenticated user.
 * Returns both sent and received friend requests with profile information.
 *
 * @param {NextRequest} request - The incoming request object
 * @param {unknown} context - Route context
 * @param {unknown} validatedData - Validated request data
 * @param {AuthContext} auth - Authenticated user context
 * @returns {Promise<NextResponse>} JSON response containing array of friend relationships
 */
async function getHandler(
  _request: any,
  _context: unknown,
  _validatedData: unknown,
  auth: AuthContext,
) {
  const friendService = new FriendService(auth);
  const friends = await friendService.getFriends();
  return successResponse(friends);
}

/**
 * Sends a new friend request to another user.
 * Creates a pending friend request from the authenticated user to the specified receiver.
 *
 * @param {NextRequest} request - The incoming request object
 * @param {unknown} context - Route context
 * @param {unknown} validatedData - Validated friend request schema
 * @param {AuthContext} auth - Authenticated user context
 * @returns {Promise<NextResponse>} JSON response containing the created friend request
 */
async function postHandler(
  _request: any,
  _context: unknown,
  validatedData: unknown,
  auth: AuthContext,
) {
  const parsedData = CreateFriendRequestSchema.parse(validatedData);
  const { receiver_id } = parsedData;

  const friendService = new FriendService(auth);
  try {
    const data = await friendService.sendFriendRequest(receiver_id);
    return successResponse(data);
  } catch (error: any) {
    return Errors.badRequest(error.message || "Failed to send friend request");
  }
}

export const GET = compose(
  withErrorHandling(),
  withLogging(),
  withRateLimit("generous"),
  withAuthRequired(),
)(getHandler);

export const POST = compose(
  withErrorHandling(),
  withLogging(),
  withValidation(CreateFriendRequestSchema),
  withRateLimit("standard"),
  withAuthRequired(),
)(postHandler);
