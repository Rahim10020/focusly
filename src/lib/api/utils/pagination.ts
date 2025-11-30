import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { PaginationMeta } from './response';

/**
 * Pagination query parameters schema
 */
export const PaginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

export type PaginationParams = z.infer<typeof PaginationSchema>;

/**
 * Result of a paginated query
 */
export interface PaginatedResult<T> {
    data: T[];
    pagination: PaginationMeta;
}

/**
 * Parse pagination parameters from URL search params
 */
export function parsePaginationParams(
    searchParams: URLSearchParams
): PaginationParams {
    return PaginationSchema.parse({
        page: searchParams.get('page'),
        limit: searchParams.get('limit'),
    });
}

/**
 * Apply pagination to a Supabase query and return paginated results
 */
export async function paginate<T>(
    query: any, // Supabase query builder
    params: PaginationParams | URLSearchParams
): Promise<PaginatedResult<T>> {
    // Parse params if URLSearchParams
    const paginationParams =
        params instanceof URLSearchParams
            ? parsePaginationParams(params)
            : params;

    const { page, limit } = paginationParams;
    const offset = (page - 1) * limit;

    // Clone the query for counting
    const countQuery = query;

    // Get total count
    const { count, error: countError } = await countQuery
        .select('*', { count: 'exact', head: true });

    if (countError) {
        throw countError;
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    // Get paginated data
    const { data, error } = await query.range(offset, offset + limit - 1);

    if (error) {
        throw error;
    }

    return {
        data: data || [],
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
    };
}

/**
 * Create pagination metadata without executing a query
 */
export function createPaginationMeta(
    page: number,
    limit: number,
    total: number
): PaginationMeta {
    const totalPages = Math.ceil(total / limit);

    return {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };
}
