/**
 * Validation schemas for Notifications API endpoints
 */
import { z } from 'zod';

/**
 * Schema for updating a notification
 * PUT /api/notifications/[id]
 */
export const UpdateNotificationSchema = z.object({
    read: z.boolean().optional(),
    archived: z.boolean().optional(),
}).refine(
    (data) => data.read !== undefined || data.archived !== undefined,
    {
        message: 'At least one field (read or archived) must be provided',
    }
);

/**
 * Schema for query parameters when listing notifications
 * GET /api/notifications
 */
export const ListNotificationsQuerySchema = z.object({
    read: z
        .enum(['true', 'false'])
        .transform((val) => val === 'true')
        .optional(),
    archived: z
        .enum(['true', 'false'])
        .transform((val) => val === 'true')
        .optional(),
    type: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * Schema for marking multiple notifications as read
 * POST /api/notifications/mark-read
 */
export const MarkNotificationsReadSchema = z.object({
    notification_ids: z.array(z.string().uuid()).min(1, {
        message: 'At least one notification ID is required',
    }),
});

export type UpdateNotificationInput = z.infer<typeof UpdateNotificationSchema>;
export type ListNotificationsQuery = z.infer<typeof ListNotificationsQuerySchema>;
export type MarkNotificationsReadInput = z.infer<typeof MarkNotificationsReadSchema>;
