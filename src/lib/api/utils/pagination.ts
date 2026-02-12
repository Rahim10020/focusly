import type { PaginationMeta } from './response';

export interface PaginationParams {
    page: number;
    limit: number;
}

export function getPaginationOffset({ page, limit }: PaginationParams): number {
    return (page - 1) * limit;
}

export function buildPaginationMeta(
    params: PaginationParams,
    total: number
): PaginationMeta {
    const totalPages = Math.max(1, Math.ceil(total / params.limit));

    return {
        page: params.page,
        limit: params.limit,
        total,
        totalPages,
        hasNext: params.page < totalPages,
        hasPrev: params.page > 1,
    };
}
