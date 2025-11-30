import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import type { ApiHandler, ApiMiddleware } from './validation';

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
    return crypto.randomUUID();
}

/**
 * Extract request metadata for logging
 */
function getRequestMetadata(req: NextRequest) {
    return {
        method: req.method,
        url: req.url,
        pathname: new URL(req.url).pathname,
        userAgent: req.headers.get('user-agent') || 'unknown',
        referer: req.headers.get('referer') || undefined,
        ip:
            req.headers.get('cf-connecting-ip') ||
            req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
            req.headers.get('x-real-ip') ||
            'unknown',
    };
}

/**
 * Middleware to add structured logging to API endpoints
 */
export function withLogging(): ApiMiddleware {
    return (handler: ApiHandler) => {
        return async (req: NextRequest, context: any, validatedData?: any) => {
            const requestId = generateRequestId();
            const startTime = Date.now();
            const metadata = getRequestMetadata(req);

            // Log incoming request
            logger.info('API Request', {
                requestId,
                ...metadata,
            });

            try {
                // Execute handler
                const response = await handler(req, context, validatedData);

                // Calculate duration
                const duration = Date.now() - startTime;

                // Log successful response
                logger.info('API Response', {
                    requestId,
                    status: response.status,
                    duration,
                    pathname: metadata.pathname,
                });

                // Add request ID header to response
                response.headers.set('X-Request-ID', requestId);

                return response;
            } catch (error) {
                // Calculate duration
                const duration = Date.now() - startTime;

                // Log error
                logger.error('API Error', error as Error, {
                    requestId,
                    duration,
                    pathname: metadata.pathname,
                    method: metadata.method,
                });

                // Re-throw to be handled by error handling middleware
                throw error;
            }
        };
    };
}

/**
 * Middleware to add request ID to all responses (lightweight version)
 */
export function withRequestId(): ApiMiddleware {
    return (handler: ApiHandler) => {
        return async (req: NextRequest, context: any, validatedData?: any) => {
            const requestId = generateRequestId();

            try {
                const response = await handler(req, context, validatedData);
                response.headers.set('X-Request-ID', requestId);
                return response;
            } catch (error) {
                // Add request ID to error context
                if (error instanceof Error) {
                    (error as any).requestId = requestId;
                }
                throw error;
            }
        };
    };
}

/**
 * Middleware for performance logging (logs slow requests)
 */
export function withPerformanceLogging(
    thresholdMs: number = 1000
): ApiMiddleware {
    return (handler: ApiHandler) => {
        return async (req: NextRequest, context: any, validatedData?: any) => {
            const startTime = Date.now();
            const metadata = getRequestMetadata(req);

            try {
                const response = await handler(req, context, validatedData);
                const duration = Date.now() - startTime;

                // Log if request is slow
                if (duration > thresholdMs) {
                    logger.warn('Slow API Request', {
                        duration,
                        threshold: thresholdMs,
                        pathname: metadata.pathname,
                        method: metadata.method,
                    });
                }

                return response;
            } catch (error) {
                const duration = Date.now() - startTime;

                // Always log errors with duration
                logger.error('API Error with Duration', error as Error, {
                    duration,
                    pathname: metadata.pathname,
                    method: metadata.method,
                });

                throw error;
            }
        };
    };
}
