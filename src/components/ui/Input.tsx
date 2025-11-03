import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export default function Input({
    label,
    error,
    className = '',
    ...props
}: InputProps) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-foreground mb-2">
                    {label}
                </label>
            )}
            <input
                className={`w-full px-4 py-2.5 bg-card text-foreground border border-border rounded-xl 
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent 
          placeholder:text-muted-foreground smooth-transition ${className}`}
                {...props}
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
    );
}