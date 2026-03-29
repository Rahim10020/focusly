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
import { getUserSupabaseClient } from "@/lib/api/supabase";
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
  const supabase = getUserSupabaseClient(auth);

  const { data, error } = await supabase
    .from("friends")
    .select(
      `
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
    `,
    )
    .or(`sender_id.eq.${auth.userId},receiver_id.eq.${auth.userId}`);

  if (error) {
    throw new Error("Failed to fetch friends");
  }

  return successResponse(data || []);
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

  if (receiver_id === auth.userId) {
    return Errors.badRequest("Cannot send friend request to yourself");
  }

  const supabase = getUserSupabaseClient(auth);

  // Ensure sender has a profile
  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", auth.userId)
    .single();

  if (!senderProfile) {
    // Create profile if it doesn't exist
    const { error: profileError } = await supabase.from("profiles").insert({
      id: auth.userId,
      username: null,
      avatar_url: null,
    });

    if (profileError) {
      throw new Error("Failed to create user profile");
    }
  }

  // Check if receiver has a profile
  const { data: receiverProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", receiver_id)
    .single();

  if (!receiverProfile) {
    return Errors.badRequest("Cannot send friend request to this user");
  }

  // Check if request already exists
  const { data: existing } = await supabase
    .from("friends")
    .select("id")
    .or(
      `and(sender_id.eq.${auth.userId},receiver_id.eq.${receiver_id}),and(sender_id.eq.${receiver_id},receiver_id.eq.${auth.userId})`,
    )
    .single();

  if (existing) {
    return Errors.badRequest("Friend request already exists");
  }

  const { data, error } = await supabase
    .from("friends")
    .insert({
      sender_id: auth.userId,
      receiver_id,
      status: "pending",
    })
    .select(
      `
      *,
      sender:profiles!friends_sender_id_fkey (
        username
      ),
      receiver:profiles!friends_receiver_id_fkey (
        username
      )
    `,
    )
    .single();

  if (error) {
    throw new Error("Failed to send friend request");
  }

  // Create notification for the receiver
  try {
    const senderName = data.sender?.username || "Someone";
    await supabase.from("notifications").insert({
      user_id: receiver_id,
      type: "friend_request",
      title: "New Friend Request",
      message: `${senderName} sent you a friend request`,
      data: { friend_request_id: data.id },
      read: false,
    });
  } catch {
    // Don't fail the friend request if notification creation fails
  }

  return successResponse(data, { status: 201 });
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
