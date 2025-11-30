/**
 * @fileoverview API route for retrieving failed (overdue) tasks.
 * A task is considered failed if it has a due_date that has passed
 * and it's not completed.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseServerPool } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { compose, withRateLimit, withLogging, withErrorHandling } from '@/lib/api/middleware';
import { successResponse, Errors } from '@/lib/api/utils/response';

/**
 * Retrieves all failed (overdue) tasks for the authenticated user.
 * A task is failed if:
 * - It has a due_date
 * - The due_date has passed
 * - It's not completed
 *
 * @param {NextRequest} request - The incoming request
 * @returns {Promise<NextResponse>} JSON response with failed tasks
 *
 * @example
 * // GET /api/tasks/failed
 *
 * @example
 * // Successful response (200 OK)
 * [
 *   {
 *     "id": "uuid",
 *     "title": "Complete project",
 *     "due_date": "2024-01-15T10:30:00Z",
 *     "completed": false,
 *     ...
 *   }
 * ]
 */
async function getHandler(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return Errors.unauthorized();
    }

    const supabaseAdmin = supabaseServerPool.getAdminClient();

    // Récupérer les tâches overdue (failed)
    const { data, error } = await supabaseAdmin
        .from('tasks')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('completed', false)
        .not('due_date', 'is', null)
        .lt('due_date', new Date().toISOString());

    if (error) {
        logger.error('Error fetching failed tasks', error as Error, {
            action: 'getFailedTasks',
            userId: session.user.id
        });
        throw new Error('Failed to fetch failed tasks');
    }

    return successResponse(data || []);
}

export const GET = compose(
    withErrorHandling(),
    withLogging(),
    withRateLimit('standard')
)(getHandler);
