/**
 * @fileoverview API route for retrieving failed (overdue) tasks.
 * A task is considered failed if it has a due_date that has passed
 * and it's not completed.
 */

import {
  compose,
  withRateLimit,
  withLogging,
  withErrorHandling,
  withAuthRequired,
} from "@/lib/api/middleware";
import { successResponse } from "@/lib/api/utils/response";
import { getAdminSupabaseClient } from "@/lib/api/supabase";
import { logger } from "@/lib/logger";
import type { AuthContext } from "@/lib/api/middleware/auth";

/**
 * Retrieves all failed (overdue) tasks for the authenticated user.
 * A task is failed if:
 * - It has a due_date
 * - The due_date has passed
 * - It's not completed
 *
 * @param {NextRequest} request - The incoming request
 * @param {unknown} context - Route context
 * @param {unknown} validatedData - Validated request data
 * @param {AuthContext} auth - Authenticated user context
 * @returns {Promise<NextResponse>} JSON response with failed tasks
 *
 * @example
 * // GET /api/tasks/failed
 *
 * @example
 * // Successful response (200 OK)
 * {
 *   "data": [{
 *     "id": "uuid",
 *     "title": "Complete project",
 *     "due_date": "2024-01-15T10:30:00Z",
 *     "completed": false,
 *     ...
 *   }],
 *   "meta": { "timestamp": "2024-01-15T10:30:00Z" }
 * }
 */
async function getHandler(
  _request: any,
  _context: unknown,
  _validatedData: unknown,
  auth: AuthContext,
) {
  const supabase = getAdminSupabaseClient();

  try {
    // Récupérer les tâches overdue (failed)
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", auth.userId)
      .eq("completed", false)
      .not("due_date", "is", null)
      .lt("due_date", new Date().toISOString());

    if (error) {
      logger.error("Error fetching failed tasks", error as Error, {
        action: "getFailedTasks",
        userId: auth.userId,
      });
      throw new Error("Failed to fetch failed tasks");
    }

    return successResponse(data || []);
  } catch (error) {
    logger.error("Failed to retrieve failed tasks", error as Error, {
      userId: auth.userId,
    });
    throw error;
  }
}

export const GET = compose(
  withErrorHandling(),
  withLogging(),
  withRateLimit("standard"),
  withAuthRequired(),
)(getHandler);
