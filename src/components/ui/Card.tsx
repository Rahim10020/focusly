import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'elevated' | 'interactive' | 'outline';
}

export default function Card({ children, className = '', variant = 'default' }: CardProps) {
    const variants = {
        default: 'shadow-sm',
        elevated: 'shadow-lg hover:shadow-xl transition-shadow duration-300',
        interactive: 'shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 cursor-pointer',
        outline: 'shadow-none border-2',
    };

    return (
        <div
            className={`bg-card text-card-foreground rounded-2xl border border-border p-6 smooth-transition ${variants[variant]} ${className}`}
        >
            {children}
        </div>
    );
}

interface CardSubComponentProps {
    children: React.ReactNode;
    className?: string;
}

export function CardHeader({ children, className = '' }: CardSubComponentProps) {
    return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }: CardSubComponentProps) {
    return <h3 className={`text-xl font-semibold text-foreground ${className}`}>{children}</h3>;
}

export function CardContent({ children, className = '' }: CardSubComponentProps) {
    return <div className={className}>{children}</div>;
}

export function CardDescription({ children, className = '' }: CardSubComponentProps) {
    return <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>;
}

export function CardFooter({ children, className = '' }: CardSubComponentProps) {
    return <div className={`mt-4 flex items-center gap-2 ${className}`}>{children}</div>;
}