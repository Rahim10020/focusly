/**
 * @fileoverview Task reordering hook.
 * Provides drag and drop reordering functionality.
 */

import { useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Task } from '@/types';
import { supabaseClient } from '@/lib/supabase/client';
import { retryWithBackoff } from '@/lib/utils/retry';
import { logger } from '@/lib/logger';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/database.types';

interface UseTaskReorderReturn {
    reorderTasks: (startIndex: number, endIndex: number) => Promise<void>;
}

interface UseTaskReorderProps {
    tasks: Task[];
    setTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void;
}

export function useTaskReorder({
    tasks,
    setTasks,
}: UseTaskReorderProps): UseTaskReorderReturn {
    const { data: session } = useSession();

    const getUserId = useCallback(() => session?.user?.id, [session]);
    const typedSupabaseClient: SupabaseClient<Database> = supabaseClient;

    const reorderTasks = useCallback(async (startIndex: number, endIndex: number) => {
        const sortedTasks = [...tasks].sort((a, b) => (a.order || 0) - (b.order || 0));
        const [removed] = sortedTasks.splice(startIndex, 1);
        sortedTasks.splice(endIndex, 0, removed);

        // Reassign order
        const reorderedTasks = sortedTasks.map((task, index) => ({
            ...task,
            order: index,
        }));

        const userId = getUserId();
        if (userId) {
            try {
                const updates = reorderedTasks.map(task => ({
                    id: task.id,
                    order: task.order,
                }));

                // Update all tasks in parallel for better performance
                await Promise.all(
                    updates.map(update =>
                        retryWithBackoff(async () => {
                            const result = await typedSupabaseClient
                                .from('tasks')
                                .update({ order: update.order })
                                .eq('id', update.id)
                                .eq('user_id', userId);
                            if (result.error) throw result.error;
                            return result;
                        })
                    )
                );

                setTasks(reorderedTasks);
            } catch (error: unknown) {
                logger.error('Error reordering tasks in DB', error as Error, {
                    action: 'reorderTasks',
                    userId: getUserId()
                });
            }
        } else {
            setTasks(reorderedTasks);
        }
    }, [tasks, getUserId, setTasks, typedSupabaseClient]);

    return {
        reorderTasks,
    };
}
