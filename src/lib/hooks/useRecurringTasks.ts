/**
 * @fileoverview Hook for managing recurring tasks.
 * Automatically creates next occurrences when tasks are completed.
 */

import { useCallback } from 'react';
import { RecurrenceService } from '@/lib/services/recurrenceService';
import { Task } from '@/types';
import { CreateTaskInput } from '@/types/task-input';

interface UseRecurringTasksProps {
    addTask: (input: CreateTaskInput) => Promise<void>;
}

/**
 * Hook to manage recurring task logic
 * @param addTask - Function to add a new task
 * @returns Object with checkAndCreateNextOccurrence function
 */
export const useRecurringTasks = ({ addTask }: UseRecurringTasksProps) => {
    const checkAndCreateNextOccurrence = useCallback(
        async (completedTask: Task) => {
            if (!RecurrenceService.shouldGenerateNext(completedTask)) {
                return;
            }

            const nextTask = RecurrenceService.generateNextOccurrence(completedTask);

            if (nextTask) {
                try {
                    // Convertir en CreateTaskInput
                    const taskInput: CreateTaskInput = {
                        title: nextTask.title,
                        priority: nextTask.priority,
                        tags: nextTask.tags,
                        dueDate: nextTask.dueDate,
                        notes: nextTask.notes,
                        subDomain: nextTask.subDomain,
                        scheduling: {
                            startDate: nextTask.startDate,
                            startTime: nextTask.startTime,
                            endTime: nextTask.endTime,
                            estimatedDuration: nextTask.estimatedDuration,
                        },
                    };

                    await addTask(taskInput);
                } catch (error) {
                    console.error('Error creating next occurrence:', error);
                }
            }
        },
        [addTask]
    );

    return { checkAndCreateNextOccurrence };
};
