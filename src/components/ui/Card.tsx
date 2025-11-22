/**
 * @fileoverview Card component and sub-components for content containers.
 */

import React from 'react';

/**
 * Props for the Card component.
 * @interface CardProps
 */
interface CardProps {
    /** The content to display inside the card */
    children: React.ReactNode;
    /** Additional CSS classes */
    className?: string;
    /** The visual style variant of the card */
    variant?: 'default' | 'elevated' | 'interactive' | 'outline' | 'none';
}

/**
 * A container component for grouping related content with various visual styles.
 *
 * @param {CardProps} props - The component props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {('default'|'elevated'|'interactive'|'outline'|'none')} [props.variant='default'] - Visual style variant
 * @returns {JSX.Element} The rendered card element
 *
 * @example
 * // Basic card
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Title</CardTitle>
 *   </CardHeader>
 *   <CardContent>Content here</CardContent>
 * </Card>
 *
 * @example
 * // Interactive card
 * <Card variant="interactive" onClick={handleClick}>
 *   Clickable content
 * </Card>
 */
export default function Card({ children, className = '', variant = 'default' }: CardProps) {
    const variants = {
        default: 'shadow-sm rounded-2xl border border-border bg-card',
        elevated: 'shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-2xl border border-border bg-card',
        interactive: 'shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 cursor-pointer rounded-2xl border border-border bg-card',
        outline: 'shadow-none border-2 rounded-2xl border border-border bg-card',
        none: 'bg-transparent',
    };

    return (
        <div
            className={`text-card-foreground  p-6 smooth-transition ${variants[variant]} ${className}`}
        >
            {children}
        </div>
    );
}

/**
 * Props for Card sub-components.
 * @interface CardSubComponentProps
 */
interface CardSubComponentProps {
    /** The content to display */
    children: React.ReactNode;
    /** Additional CSS classes */
    className?: string;
}

/**
 * Header section of a Card component.
 *
 * @param {CardSubComponentProps} props - The component props
 * @returns {JSX.Element} The rendered card header
 */
export function CardHeader({ children, className = '' }: CardSubComponentProps) {
    return <div className={`mb-4 ${className}`}>{children}</div>;
}

/**
 * Title element for use within CardHeader.
 *
 * @param {CardSubComponentProps} props - The component props
 * @returns {JSX.Element} The rendered card title
 */
export function CardTitle({ children, className = '' }: CardSubComponentProps) {
    return <h3 className={`text-xl font-semibold text-foreground ${className}`}>{children}</h3>;
}

/**
 * Main content section of a Card component.
 *
 * @param {CardSubComponentProps} props - The component props
 * @returns {JSX.Element} The rendered card content
 */
export function CardContent({ children, className = '' }: CardSubComponentProps) {
    return <div className={className}>{children}</div>;
}

/**
 * Description text for use within Card.
 *
 * @param {CardSubComponentProps} props - The component props
 * @returns {JSX.Element} The rendered card description
 */
export function CardDescription({ children, className = '' }: CardSubComponentProps) {
    return <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>;
}

/**
 * Footer section of a Card component.
 *
 * @param {CardSubComponentProps} props - The component props
 * @returns {JSX.Element} The rendered card footer
 */
export function CardFooter({ children, className = '' }: CardSubComponentProps) {
    return <div className={`mt-4 flex items-center gap-2 ${className}`}>{children}</div>;
}