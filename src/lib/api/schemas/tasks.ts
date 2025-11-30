/**
 * Validation schemas for Tasks API endpoints
 */
import { z } from 'zod';

/**
 * Schema for creating a task
 * POST /api/tasks
 */
export const CreateTaskSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    description: z.string().max(1000, 'Description too long').optional(),
    category: z.string().min(1, 'Category is required').max(50),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    estimated_time: z.number().int().positive().optional(),
    due_date: z.string().datetime().optional(),
    tags: z.array(z.string()).optional(),
    parent_task_id: z.string().uuid().optional(),
    is_recurring: z.boolean().default(false),
    recurrence_pattern: z
        .object({
            frequency: z.enum(['daily', 'weekly', 'monthly']),
            interval: z.number().int().positive().default(1),
            end_date: z.string().datetime().optional(),
        })
        .optional(),
});

/**
 * Schema for updating a task
 * PUT /api/tasks/[id]
 */
export const UpdateTaskSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    category: z.string().min(1).max(50).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    status: z.enum(['pending', 'in_progress', 'completed', 'failed']).optional(),
    estimated_time: z.number().int().positive().optional(),
    actual_time: z.number().int().positive().optional(),
    due_date: z.string().datetime().optional(),
    completed_at: z.string().datetime().optional(),
    tags: z.array(z.string()).optional(),
});

/**
 * Schema for listing tasks
 * GET /api/tasks
 */
export const ListTasksQuerySchema = z.object({
    status: z
        .enum(['pending', 'in_progress', 'completed', 'failed'])
        .optional(),
    category: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    due_before: z.string().datetime().optional(),
    due_after: z.string().datetime().optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    sort_by: z.enum(['created_at', 'due_date', 'priority']).default('created_at'),
    sort_order: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Schema for getting failed tasks
 * GET /api/tasks/failed
 */
export const FailedTasksQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    from_date: z.string().datetime().optional(),
    to_date: z.string().datetime().optional(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type ListTasksQuery = z.infer<typeof ListTasksQuerySchema>;
export type FailedTasksQuery = z.infer<typeof FailedTasksQuerySchema>;
