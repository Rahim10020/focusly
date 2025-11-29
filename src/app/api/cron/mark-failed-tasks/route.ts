/**
 * @fileoverview API route for marking overdue tasks as failed.
 * This endpoint should be called periodically (via cron or scheduled task)
 * to automatically mark tasks with passed due dates as failed.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServerPool } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

/**
 * Marks all overdue tasks as failed by calling the Supabase function.
 * This endpoint can be called by:
 * - Vercel Cron Jobs
 * - External cron services (with proper authentication)
 * - Manual trigger for testing
 *
 * @param {NextRequest} request - The incoming request
 * @returns {Promise<NextResponse>} JSON response with the number of tasks marked as failed
 *
 * @example
 * // Call via cron (vercel.json)
 * {
 *   "crons": [{
 *     "path": "/api/cron/mark-failed-tasks",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 *
 * @example
 * // Manual call
 * // GET /api/cron/mark-failed-tasks?secret=your-secret-key
 *
 * @example
 * // Successful response (200 OK)
 * {
 *   "success": true,
 *   "markedCount": 15,
 *   "message": "Marked 15 tasks as failed"
 * }
 */
export async function GET(request: NextRequest) {
    try {
        // ✅ Security: Verify cron secret for manual calls
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;
        
        // Allow Vercel Cron (has specific headers) or requests with valid secret
        const isVercelCron = request.headers.get('x-vercel-cron') === '1';
        const hasValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`;
        
        if (!isVercelCron && !hasValidSecret) {
            logger.warn('Unauthorized cron attempt', {
                action: 'markFailedTasks',
                headers: Object.fromEntries(request.headers.entries())
            });
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const supabaseAdmin = supabaseServerPool.getAdminClient();

        // Call the Supabase function to mark overdue tasks
        const { data, error } = await supabaseAdmin.rpc('mark_overdue_tasks_as_failed');

        if (error) {
            logger.error('Error marking overdue tasks as failed', error as Error, {
                action: 'markFailedTasks'
            });
            return NextResponse.json(
                { error: 'Failed to mark tasks as failed' },
                { status: 500 }
            );
        }

        const markedCount = data as number;

        logger.info(`Marked ${markedCount} tasks as failed`, {
            action: 'markFailedTasks',
            count: markedCount
        });

        return NextResponse.json({
            success: true,
            markedCount,
            message: `Marked ${markedCount} task(s) as failed`,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error in mark-failed-tasks cron', error as Error, {
            action: 'markFailedTasksCron'
        });
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
