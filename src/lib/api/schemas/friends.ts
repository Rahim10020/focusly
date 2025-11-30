/**
 * Validation schemas for Friends API endpoints
 */
import { z } from 'zod';

/**
 * Schema for creating a friend request
 * POST /api/friends
 */
export const CreateFriendRequestSchema = z.object({
    receiver_id: z.string().uuid({
        message: 'receiver_id must be a valid UUID',
    }),
});

/**
 * Schema for accepting/rejecting a friend request
 * PUT /api/friends/[id]
 */
export const UpdateFriendRequestSchema = z.object({
    action: z.enum(['accept', 'reject'], {
        errorMap: () => ({
            message: 'action must be either "accept" or "reject"',
        }),
    }),
});

/**
 * Schema for query parameters when listing friends
 * GET /api/friends
 */
export const ListFriendsQuerySchema = z.object({
    status: z
        .enum(['pending', 'accepted', 'rejected'])
        .optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateFriendRequestInput = z.infer<typeof CreateFriendRequestSchema>;
export type UpdateFriendRequestInput = z.infer<typeof UpdateFriendRequestSchema>;
export type ListFriendsQuery = z.infer<typeof ListFriendsQuerySchema>;
