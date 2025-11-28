/**
 * @fileoverview Centralized error handling utilities.
 * Provides custom error classes and standardized error handling.
 */

import { logger } from '@/lib/logger';

/**
 * Base application error class with operational flag
 */
export class AppError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number = 500,
        public isOperational: boolean = true
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Validation error for invalid input
 */
export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, 'VALIDATION_ERROR', 400);
    }
}

/**
 * Authentication error for unauthorized access
 */
export class AuthenticationError extends AppError {
    constructor(message: string = 'Authentication required') {
        super(message, 'AUTH_ERROR', 401);
    }
}

/**
 * Not found error for missing resources
 */
export class NotFoundError extends AppError {
    constructor(resource: string) {
        super(`${resource} not found`, 'NOT_FOUND', 404);
    }
}

/**
 * Database error for data layer issues
 */
export class DatabaseError extends AppError {
    constructor(message: string, originalError?: Error) {
        super(message, 'DATABASE_ERROR', 500);
        if (originalError) {
            logger.error('Database error', originalError, { context: message });
        }
    }
}

/**
 * Rate limit error for too many requests
 */
export class RateLimitError extends AppError {
    constructor(message: string = 'Too many requests') {
        super(message, 'RATE_LIMIT_ERROR', 429);
    }
}

/**
 * Handle any error and return a standardized response
 */
export function handleError(error: unknown): { message: string; code: string; statusCode: number } {
    if (error instanceof AppError) {
        return {
            message: error.message,
            code: error.code,
            statusCode: error.statusCode
        };
    }

    if (error instanceof Error) {
        logger.error('Unexpected error', error);
        return {
            message: 'An unexpected error occurred',
            code: 'INTERNAL_ERROR',
            statusCode: 500
        };
    }

    logger.error('Unknown error', new Error(String(error)));
    return {
        message: 'An unknown error occurred',
        code: 'UNKNOWN_ERROR',
        statusCode: 500
    };
}

/**
 * Check if an error is operational (expected) or programming error
 */
export function isOperationalError(error: Error): boolean {
    if (error instanceof AppError) {
        return error.isOperational;
    }
    return false;
}
