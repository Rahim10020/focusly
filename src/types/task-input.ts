import { Priority, SubDomain } from './index';

/**
 * Input interface for creating a new task
 * Groups related parameters for better organization and extensibility
 */
export interface CreateTaskInput {
    /** Task title (required) */
    title: string;

    /** Task priority level */
    priority?: Priority;

    /** Array of tag IDs */
    tags?: string[];

    /** Due date timestamp */
    dueDate?: number;

    /** Task notes/description */
    notes?: string;

    /** Sub-domain category */
    subDomain?: SubDomain;

    /** Scheduling information */
    scheduling?: {
        /** Start date timestamp */
        startDate?: number;

        /** Start time in HH:mm format */
        startTime?: string;

        /** End time in HH:mm format */
        endTime?: string;

        /** Estimated duration in minutes */
        estimatedDuration?: number;
    };
}

/**
 * Helper function to create a task input from individual parameters
 * Useful for backward compatibility with existing code
 */
export function createTaskInput(
    title: string,
    priority?: Priority,
    tags?: string[],
    dueDate?: number,
    notes?: string,
    subDomain?: SubDomain,
    startDate?: number,
    startTime?: string,
    endTime?: string,
    estimatedDuration?: number
): CreateTaskInput {
    const input: CreateTaskInput = {
        title,
        priority,
        tags,
        dueDate,
        notes,
        subDomain
    };

    // Only add scheduling if at least one scheduling field is provided
    if (startDate || startTime || endTime || estimatedDuration) {
        input.scheduling = {
            startDate,
            startTime,
            endTime,
            estimatedDuration
        };
    }

    return input;
}
