import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Errors } from '../utils/response';

export type ApiHandler<T = any> = (
    req: NextRequest,
    context: any,
    validatedData?: T
) => Promise<NextResponse>;

export type ApiMiddleware = (handler: ApiHandler) => ApiHandler;

/**
 * Middleware to validate request body against a Zod schema
 */
export function withValidation<T extends z.ZodSchema>(
    schema: T
): ApiMiddleware {
    return (handler: ApiHandler) => {
        return async (req: NextRequest, context: any) => {
            try {
                // Parse request body
                const body = await req.json();

                // Validate with Zod
                const validated = schema.parse(body);

                // Pass validated data to handler
                return handler(req, context, validated);
            } catch (err) {
                // Handle Zod validation errors
                if (err instanceof z.ZodError) {
                    const details = err.issues.map((error: z.ZodIssue) => ({
                        field: error.path.join('.'),
                        message: error.message,
                        code: error.code,
                    }));

                    return Errors.validation(details);
                }

                // Handle JSON parsing errors
                if (err instanceof SyntaxError) {
                    return Errors.badRequest('Invalid JSON in request body');
                }

                // Re-throw unexpected errors
                throw err;
            }
        };
    };
}

/**
 * Middleware to validate query parameters against a Zod schema
 */
export function withQueryValidation<T extends z.ZodSchema>(
    schema: T
): ApiMiddleware {
    return (handler: ApiHandler) => {
        return async (req: NextRequest, context: any) => {
            try {
                // Get search params
                const { searchParams } = new URL(req.url);

                // Convert to object
                const queryObject: Record<string, any> = {};
                searchParams.forEach((value, key) => {
                    queryObject[key] = value;
                });

                // Validate with Zod
                const validated = schema.parse(queryObject);

                // Pass validated data to handler
                return handler(req, context, validated);
            } catch (err) {
                // Handle Zod validation errors
                if (err instanceof z.ZodError) {
                    const details = err.issues.map((error: z.ZodIssue) => ({
                        field: error.path.join('.'),
                        message: error.message,
                        code: error.code,
                    }));

                    return Errors.validation(details);
                }

                // Re-throw unexpected errors
                throw err;
            }
        };
    };
}

/**
 * Middleware to validate both body and query parameters
 */
export function withBodyAndQueryValidation<
    TBody extends z.ZodSchema,
    TQuery extends z.ZodSchema
>(bodySchema: TBody, querySchema: TQuery): ApiMiddleware {
    return (handler: ApiHandler) => {
        return async (req: NextRequest, context: any) => {
            try {
                // Parse and validate body
                const body = await req.json();
                const validatedBody = bodySchema.parse(body);

                // Parse and validate query
                const { searchParams } = new URL(req.url);
                const queryObject: Record<string, any> = {};
                searchParams.forEach((value, key) => {
                    queryObject[key] = value;
                });
                const validatedQuery = querySchema.parse(queryObject);

                // Pass both validated data to handler
                return handler(req, context, {
                    body: validatedBody,
                    query: validatedQuery,
                });
            } catch (err) {
                // Handle Zod validation errors
                if (err instanceof z.ZodError) {
                    const details = err.issues.map((error: z.ZodIssue) => ({
                        field: error.path.join('.'),
                        message: error.message,
                        code: error.code,
                    }));

                    return Errors.validation(details);
                }

                // Handle JSON parsing errors
                if (err instanceof SyntaxError) {
                    return Errors.badRequest('Invalid JSON in request body');
                }

                // Re-throw unexpected errors
                throw err;
            }
        };
    };
}
