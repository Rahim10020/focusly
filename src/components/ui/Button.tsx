import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    children: React.ReactNode;
}

export default function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    className = '',
    children,
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles = 'rounded-full cursor-pointer font-medium transition-all duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale focus-ring inline-flex items-center justify-center gap-2';

    const variants = {
        primary: 'bg-primary text-primary-foreground hover:bg-[var(--brand-primary-dark)] active:scale-[0.98] shadow-sm hover:shadow-md',
        secondary: 'bg-muted text-foreground hover:bg-accent active:scale-[0.98]',
        ghost: 'bg-transparent text-foreground hover:bg-muted active:scale-[0.98]',
        outline: 'bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground active:scale-[0.98]',
        danger: 'bg-[var(--error)] text-white hover:bg-[var(--error-light)] active:scale-[0.98] shadow-sm hover:shadow-md',
        success: 'bg-[var(--success)] text-white hover:bg-[var(--success-light)] active:scale-[0.98] shadow-sm hover:shadow-md',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs md:text-sm h-8',
        md: 'px-5 py-2.5 text-sm md:text-base h-10',
        lg: 'px-6 py-3 text-base md:text-lg h-12',
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            )}
            {children}
        </button>
    );
}