import { NextResponse } from 'next/server';

/**
 * Standard response format for successful API responses
 */
export interface ApiSuccessResponse<T = any> {
    data: T;
    pagination?: PaginationMeta;
    meta: ResponseMeta;
}

/**
 * Standard response format for error responses
 */
export interface ApiErrorResponse {
    error: {
        code: string;
        message: string;
        details?: any[];
    };
    meta: ResponseMeta;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

/**
 * Response metadata
 */
export interface ResponseMeta {
    timestamp: string;
    requestId?: string;
}

/**
 * Create a successful JSON response
 */
export function successResponse<T>(
    data: T,
    options?: {
        pagination?: PaginationMeta;
        requestId?: string;
        status?: number;
        headers?: Record<string, string>;
    }
): NextResponse<ApiSuccessResponse<T>> {
    const response: ApiSuccessResponse<T> = {
        data,
        meta: {
            timestamp: new Date().toISOString(),
            requestId: options?.requestId,
        },
    };

    if (options?.pagination) {
        response.pagination = options.pagination;
    }

    return NextResponse.json(response, {
        status: options?.status || 200,
        headers: options?.headers,
    });
}

/**
 * Create an error JSON response
 */
export function errorResponse(
    code: string,
    message: string,
    options?: {
        details?: any[];
        requestId?: string;
        status?: number;
        headers?: Record<string, string>;
    }
): NextResponse<ApiErrorResponse> {
    const response: ApiErrorResponse = {
        error: {
            code,
            message,
            details: options?.details,
        },
        meta: {
            timestamp: new Date().toISOString(),
            requestId: options?.requestId,
        },
    };

    return NextResponse.json(response, {
        status: options?.status || 500,
        headers: options?.headers,
    });
}

/**
 * Standard error codes
 */
export const ErrorCodes = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    BAD_REQUEST: 'BAD_REQUEST',
} as const;

/**
 * Helper to create common error responses
 */
export const Errors = {
    validation: (details?: any[], requestId?: string) =>
        errorResponse(ErrorCodes.VALIDATION_ERROR, 'Validation failed', {
            details,
            requestId,
            status: 400,
        }),

    unauthorized: (message = 'Unauthorized', requestId?: string) =>
        errorResponse(ErrorCodes.UNAUTHORIZED, message, {
            requestId,
            status: 401,
        }),

    forbidden: (message = 'Forbidden', requestId?: string) =>
        errorResponse(ErrorCodes.FORBIDDEN, message, {
            requestId,
            status: 403,
        }),

    notFound: (message = 'Resource not found', requestId?: string) =>
        errorResponse(ErrorCodes.NOT_FOUND, message, {
            requestId,
            status: 404,
        }),

    tooManyRequests: (
        message = 'Too many requests',
        headers?: Record<string, string>,
        requestId?: string
    ) =>
        errorResponse(ErrorCodes.TOO_MANY_REQUESTS, message, {
            requestId,
            status: 429,
            headers,
        }),

    internal: (message = 'Internal server error', requestId?: string) =>
        errorResponse(ErrorCodes.INTERNAL_ERROR, message, {
            requestId,
            status: 500,
        }),

    badRequest: (message = 'Bad request', requestId?: string) =>
        errorResponse(ErrorCodes.BAD_REQUEST, message, {
            requestId,
            status: 400,
        }),
};
