import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export default function Card({ children, className = '' }: CardProps) {
    return (
        <div
            className={`bg-card text-card-foreground rounded-2xl border border-border p-6 shadow-sm smooth-transition ${className}`}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className = '' }: CardProps) {
    return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }: CardProps) {
    return <h3 className={`text-xl font-semibold ${className}`}>{children}</h3>;
}

export function CardContent({ children, className = '' }: CardProps) {
    return <div className={className}>{children}</div>;
}