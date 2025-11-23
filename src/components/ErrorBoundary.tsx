/**
 * @fileoverview Error boundary components for catching and handling React errors.
 * Provides both class-based and functional wrapper components.
 */

'use client';

import React from 'react';
import { logger } from '@/lib/logger';
import Button from './ui/Button';

/**
 * Props for the ErrorBoundary component.
 * @interface Props
 * @property {React.ReactNode} children - Child components to render
 * @property {React.ReactNode} [fallback] - Custom fallback UI to show on error
 * @property {() => void} [onReset] - Callback when user attempts to reset/retry
 */
interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onReset?: () => void;
}

/**
 * Internal state for the ErrorBoundary component.
 * @interface State
 * @property {boolean} hasError - Whether an error has been caught
 * @property {Error} [error] - The caught error object
 * @property {React.ErrorInfo} [errorInfo] - React error info with component stack
 */
interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: React.ErrorInfo;
}

/**
 * Error boundary class component that catches JavaScript errors in child components.
 * Displays a fallback UI instead of crashing the entire application.
 * Logs errors to the application's logging service.
 *
 * @class ErrorBoundary
 * @extends {React.Component<Props, State>}
 *
 * @example
 * // Basic usage
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 *
 * @example
 * // With custom fallback UI
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <YourComponent />
 * </ErrorBoundary>
 *
 * @example
 * // With reset callback
 * <ErrorBoundary onReset={() => refetchData()}>
 *   <DataComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log the error to our logging service
        logger.error('React Error Boundary caught error', error, {
            action: 'componentDidCatch',
            componentStack: errorInfo.componentStack,
            errorBoundary: 'ErrorBoundary'
        });

        this.setState({ errorInfo });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
        this.props.onReset?.();
    };

    render() {
        if (this.state.hasError) {
            // If custom fallback is provided, use it
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="min-h-[400px] flex items-center justify-center p-6">
                    <div className="max-w-md w-full bg-error/10 border border-error rounded-lg p-6 space-y-4">
                        <div className="flex items-start gap-3">
                            <svg
                                className="w-6 h-6 text-error flex-shrink-0 mt-0.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <div className="flex-1">
                                <h2 className="text-lg font-semibold text-error mb-2">
                                    Something went wrong
                                </h2>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {this.state.error?.message || 'An unexpected error occurred'}
                                </p>

                                {process.env.NODE_ENV === 'development' && this.state.error && (
                                    <details className="mt-4 p-3 bg-background rounded border border-border">
                                        <summary className="cursor-pointer text-xs font-medium mb-2">
                                            Error Details (Development Only)
                                        </summary>
                                        <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-words">
                                            {this.state.error.stack}
                                        </pre>
                                    </details>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={this.handleReset}
                                variant="primary"
                                size="sm"
                                className="flex-1"
                            >
                                Try Again
                            </Button>
                            <Button
                                onClick={() => window.location.reload()}
                                variant="outline"
                                size="sm"
                                className="flex-1"
                            >
                                Reload Page
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Hook-based wrapper for ErrorBoundary (for functional components)
 *
 * Usage:
 * function MyPage() {
 *   return (
 *     <ErrorBoundaryWrapper>
 *       <YourComponent />
 *     </ErrorBoundaryWrapper>
 *   );
 * }
 */
export function ErrorBoundaryWrapper({ children }: { children: React.ReactNode }) {
    return <ErrorBoundary>{children}</ErrorBoundary>;
}
