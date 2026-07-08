/**
 * @fileoverview User preferences API route.
 *
 * Provides endpoints for managing user preferences.
 * Uses upsert to create or update preferences as needed.
 *
 * Route: /api/users/preferences
 */

import {
  compose,
  withRateLimit,
  withValidation,
  withLogging,
  withErrorHandling,
  withAuthRequired,
} from "@/lib/api/middleware";
import { UpdateUserPreferencesSchema } from "@/lib/api/schemas";
import { successResponse } from "@/lib/api/utils/response";
import { getAdminSupabaseClient } from "@/lib/api/supabase";
import { Cache } from "@/lib/cache";
import { logger } from "@/lib/logger";
import type { AuthContext } from "@/lib/api/middleware/auth";

/**
 * Retrieves the authenticated user's preferences.
 */
async function getHandler(
  _request: any,
  _context: unknown,
  _validatedData: unknown,
  auth: AuthContext,
) {
  const supabase = getAdminSupabaseClient();

  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", auth.userId)
    .single();

  if (error && error.code !== "PGRST116") {
    logger.error("Error fetching user preferences", error as Error, {
      action: "getHandler - fetchPreferences",
      userId: auth.userId,
      errorCode: error.code,
      errorMessage: error.message,
    });
    throw new Error("Failed to fetch preferences");
  }

  // Return empty preferences if none exist
  if (!data) {
    return successResponse({
      user_id: auth.userId,
    });
  }

  return successResponse(data);
}

/**
 * Updates the user's preferences.
 *
 * Creates a new preference record if one doesn't exist, or updates the
 * existing record. Requires authentication.
 */
async function postHandler(
  _request: any,
  _context: unknown,
  validatedData: unknown,
  auth: AuthContext,
) {
  const parsedData = UpdateUserPreferencesSchema.parse(validatedData);

  try {
    const supabase = getAdminSupabaseClient();

    // Get current preferences to merge with updates
    const { data: currentPrefs, error: fetchError } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", auth.userId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      logger.error("Error fetching current preferences", fetchError as Error, {
        action: "postHandler - fetchPreferences",
        userId: auth.userId,
        errorCode: fetchError.code,
        errorMessage: fetchError.message,
      });
    }

    // Merge validated data with current preferences
    const updatedPrefs = {
      ...(currentPrefs || {}),
      ...parsedData,
      user_id: auth.userId, // Use session user ID, not request body
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from("user_preferences")
      .upsert(updatedPrefs, { onConflict: "user_id" });

    if (upsertError) {
      logger.error("Error upserting user preferences", upsertError as Error, {
        action: "postHandler - upsert",
        userId: auth.userId,
        errorCode: upsertError.code,
        errorMessage: upsertError.message,
        data: JSON.stringify(updatedPrefs),
      });
      throw new Error(`Failed to update preferences: ${upsertError.message}`);
    }

    // Invalidate cache for this user's preferences
    await Cache.invalidate(`user-preferences:${auth.userId}`);

    return successResponse({ success: true });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Error in preferences handler", error as Error, {
      action: "postHandler",
      userId: auth.userId,
      errorMessage,
    });
    throw error;
  }
}

export const GET = compose(
  withErrorHandling(),
  withAuthRequired(),
  withLogging(),
  withRateLimit("standard"),
)(getHandler);

export const POST = compose(
  withErrorHandling(),
  withValidation(UpdateUserPreferencesSchema),
  withAuthRequired(),
  withLogging(),
  withRateLimit("standard"),
)(postHandler);
