/**
 * Common validation schemas shared across API endpoints
 */
import { z } from 'zod';

/**
 * UUID parameter schema for route parameters
 */
export const UuidParamSchema = z.object({
    id: z.string().uuid({
        message: 'Invalid ID format',
    }),
});

/**
 * Base pagination schema
 */
export const BasePaginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * Date range schema
 */
export const DateRangeSchema = z.object({
    from_date: z.string().datetime().optional(),
    to_date: z.string().datetime().optional(),
});

/**
 * Sort schema
 */
export const SortSchema = z.object({
    sort_by: z.string().default('created_at'),
    sort_order: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Search schema
 */
export const SearchSchema = z.object({
    search: z.string().min(1).max(200).optional(),
});

export type UuidParam = z.infer<typeof UuidParamSchema>;
export type BasePagination = z.infer<typeof BasePaginationSchema>;
export type DateRange = z.infer<typeof DateRangeSchema>;
export type Sort = z.infer<typeof SortSchema>;
export type Search = z.infer<typeof SearchSchema>;
