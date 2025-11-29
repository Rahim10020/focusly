/**
 * @fileoverview Service for managing recurring tasks.
 * Generates next occurrences based on recurrence patterns.
 */

import { Task } from '@/types';

export class RecurrenceService {
    /**
     * Génère la prochaine occurrence d'une tâche récurrente
     * @param task - The task to generate next occurrence from
     * @returns Next task occurrence or null if recurrence ended
     */
    static generateNextOccurrence(task: Task): Omit<Task, 'id'> | null {
        if (!task.isRecurring) return null;

        const nextTask = { ...task };
        delete (nextTask as any).id; // Nouvelle instance sans ID
        (nextTask as any).parentRecurringTaskId = task.id;
        nextTask.completed = false;
        nextTask.completedAt = undefined;
        nextTask.status = 'todo';

        // Calculer la prochaine date
        const baseDate = task.dueDate || task.startDate || Date.now();
        const currentDate = new Date(baseDate);
        let nextDate = new Date(currentDate);

        switch (task.recurrencePattern) {
            case 'daily':
                nextDate.setDate(nextDate.getDate() + (task.recurrenceInterval || 1));
                break;

            case 'weekly':
                nextDate.setDate(nextDate.getDate() + (7 * (task.recurrenceInterval || 1)));
                break;

            case 'monthly':
                nextDate.setMonth(nextDate.getMonth() + (task.recurrenceInterval || 1));
                break;

            case 'custom':
                if (task.recurrenceDaysOfWeek && task.recurrenceDaysOfWeek.length > 0) {
                    // Trouver le prochain jour qui correspond
                    nextDate.setDate(nextDate.getDate() + 1);
                    let attempts = 0;
                    while (!task.recurrenceDaysOfWeek.includes(nextDate.getDay()) && attempts < 7) {
                        nextDate.setDate(nextDate.getDate() + 1);
                        attempts++;
                    }
                }
                break;
        }

        // Vérifier si on a dépassé la date de fin
        if (task.recurrenceEndDate && nextDate > new Date(task.recurrenceEndDate)) {
            return null;
        }

        // Mettre à jour les dates
        if (task.startDate) {
            nextTask.startDate = nextDate.getTime();
        }
        if (task.dueDate) {
            nextTask.dueDate = nextDate.getTime();
        }

        return nextTask;
    }

    /**
     * Vérifie si une tâche récurrente doit générer une nouvelle occurrence
     * @param task - The task to check
     * @returns True if next occurrence should be generated
     */
    static shouldGenerateNext(task: Task): boolean {
        if (!task.isRecurring || !task.completed) return false;

        // Si une date de fin est définie, vérifier qu'on ne l'a pas dépassée
        if (task.recurrenceEndDate) {
            const endDate = new Date(task.recurrenceEndDate);
            const now = new Date();
            if (now > endDate) return false;
        }

        return true;
    }

    /**
     * Calcule le libellé de récurrence pour l'affichage
     * @param task - The task with recurrence settings
     * @returns Human-readable recurrence description
     */
    static getRecurrenceLabel(task: Task): string | null {
        if (!task.isRecurring) return null;

        const interval = task.recurrenceInterval || 1;
        const pattern = task.recurrencePattern || 'daily';

        const labels: Record<string, string> = {
            daily: interval === 1 ? 'Daily' : `Every ${interval} days`,
            weekly: interval === 1 ? 'Weekly' : `Every ${interval} weeks`,
            monthly: interval === 1 ? 'Monthly' : `Every ${interval} months`,
            custom: 'Custom schedule',
        };

        return labels[pattern] || null;
    }
}
