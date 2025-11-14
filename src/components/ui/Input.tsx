import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    success?: boolean;
    helperText?: string;
}

export default function Input({
    label,
    error,
    success,
    helperText,
    className = '',
    ...props
}: InputProps) {
    const borderColor = error
        ? 'border-[var(--error)] focus:ring-[var(--error)]'
        : success
        ? 'border-[var(--success)] focus:ring-[var(--success)]'
        : 'border-border focus:ring-primary';

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-foreground mb-2">
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    className={`w-full px-4 py-2.5 bg-card text-foreground border-2 rounded-xl
                        focus:outline-none focus:ring-2 focus:ring-offset-0
                        placeholder:text-muted-foreground
                        transition-all duration-300 ease-out
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${borderColor} ${className}`}
                    {...props}
                />
                {success && !error && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg
                            className="w-5 h-5 text-[var(--success)]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>
                )}
                {error && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg
                            className="w-5 h-5 text-[var(--error)]"
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
                    </div>
                )}
            </div>
            {error && (
                <p className="mt-1.5 text-sm text-[var(--error)] flex items-center gap-1">
                    {error}
                </p>
            )}
            {helperText && !error && (
                <p className="mt-1.5 text-sm text-muted-foreground">
                    {helperText}
                </p>
            )}
        </div>
    );
}