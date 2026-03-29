/**
 * @fileoverview Individual friend request operations API route.
 *
 * Provides endpoints for managing a specific friend request by ID,
 * including accepting, rejecting, and deleting requests.
 *
 * Route: /api/friends/[id]
 */

import {
  compose,
  withErrorHandling,
  withLogging,
  withRateLimit,
  withValidation,
  withAuthRequired,
} from "@/lib/api/middleware";
import { UpdateFriendRequestSchema } from "@/lib/api/schemas";
import { successResponse, Errors } from "@/lib/api/utils/response";
import { getUserSupabaseClient } from "@/lib/api/supabase";
import { logger } from "@/lib/logger";
import type { AuthContext } from "@/lib/api/middleware/auth";

/**
 * Accepts or rejects a pending friend request.
 * Only the receiver of a friend request can accept or reject it.
 */
async function putHandler(
  _request: any,
  context: any,
  validatedData: unknown,
  auth: AuthContext,
) {
  const parsedData = UpdateFriendRequestSchema.parse(validatedData);
  const { id: friendId } = await context.params;
  const { action } = parsedData;

  const supabase = getUserSupabaseClient(auth);

  // Check if the user is the receiver of this friend request
  const { data: friendRequestData, error: fetchError } = await supabase
    .from("friends")
    .select("sender_id, receiver_id, status")
    .eq("id", friendId)
    .single();

  if (fetchError || !friendRequestData) {
    return Errors.notFound("Friend request not found");
  }

  const typedData = friendRequestData as {
    receiver_id: string;
    status: "pending" | "accepted" | "rejected";
    sender_id: string;
  };

  if (typedData.receiver_id !== auth.userId) {
    return Errors.forbidden("Unauthorized to modify this request");
  }

  if (typedData.status !== "pending") {
    return Errors.badRequest("Request already processed");
  }

  // Update friendship status
  const newStatus = action === "accept" ? "accepted" : "rejected";
  const { error: updateError } = await supabase
    .from("friends")
    .update({ status: newStatus })
    .eq("id", friendId);

  if (updateError) {
    logger.error("Error updating friend request", updateError as Error, {
      friendId,
      action: "updateFriendRequest",
    });
    throw new Error("Failed to update friend request");
  }

  // Delete original friend request notification
  try {
    await supabase
      .from("notifications")
      .delete()
      .eq("type", "friend_request")
      .eq("data->friend_request_id", friendId);
  } catch {
    // Don't fail if notification deletion fails
  }

  // Create notification for the other party
  const notificationType =
    action === "accept" ? "friend_accepted" : "friend_rejected";
  try {
    await supabase.from("notifications").insert({
      user_id: typedData.sender_id,
      type: notificationType,
      title:
        action === "accept"
          ? "Friend Request Accepted"
          : "Friend Request Rejected",
      message:
        action === "accept"
          ? "Your friend request was accepted"
          : "Your friend request was rejected",
      data: { friend_request_id: friendId },
      read: false,
    });
  } catch {
    // Don't fail if notification creation fails
  }

  // Fetch updated friend request to return
  const { data: updatedData } = await supabase
    .from("friends")
    .select("*")
    .eq("id", friendId)
    .single();

  return successResponse(updatedData || {});
}

/**
 * Deletes (removes) a friendship.
 * Either user in the friendship can delete it.
 */
async function deleteHandler(
  _request: any,
  context: any,
  _validatedData: unknown,
  auth: AuthContext,
) {
  const { id: friendshipId } = await context.params;

  const supabase = getUserSupabaseClient(auth);

  // Check if the user is part of this friendship
  const { data: friendshipData, error: fetchError } = await supabase
    .from("friends")
    .select("sender_id, receiver_id, status")
    .eq("id", friendshipId)
    .single();

  if (fetchError || !friendshipData) {
    return Errors.notFound("Friendship not found");
  }

  const typedData = friendshipData as {
    sender_id: string;
    receiver_id: string;
    status: string;
  };

  // Verify user is either sender or receiver
  if (
    typedData.sender_id !== auth.userId &&
    typedData.receiver_id !== auth.userId
  ) {
    return Errors.forbidden("Unauthorized to remove this friendship");
  }

  // Delete the friendship
  const { error: deleteError } = await supabase
    .from("friends")
    .delete()
    .eq("id", friendshipId);

  if (deleteError) {
    logger.error("Error deleting friendship", deleteError as Error, {
      friendshipId,
      action: "deleteFriendship",
    });
    throw new Error("Failed to remove friend");
  }

  logger.info("Friendship removed", {
    action: "removeFriend",
    friendshipId,
    userId: auth.userId,
  });

  return successResponse({ message: "Friend removed successfully" });
}

export const PUT = compose(
  withErrorHandling(),
  withLogging(),
  withValidation(UpdateFriendRequestSchema),
  withRateLimit("standard"),
  withAuthRequired(),
)(putHandler);

export const DELETE = compose(
  withErrorHandling(),
  withLogging(),
  withRateLimit("standard"),
  withAuthRequired(),
)(deleteHandler);
