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
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
            return NextResponse.json(
                { error: 'Failed to fetch failed tasks' },
                { status: 500 }
            );
        }

        return NextResponse.json(data || []);
    } catch (error) {
        logger.error('Error in failed tasks API', error as Error, {
            action: 'failedTasksAPI'
        });
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
