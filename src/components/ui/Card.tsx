/**
 * @fileoverview Card component and sub-components for content containers.
 */

import { ReactNode } from "react";

/**
 * Props for the Card component.
 * @interface CardProps
 */
interface CardProps {
  /** The content to display inside the card */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** The visual style variant of the card */
  variant?: "default" | "elevated" | "interactive" | "outline" | "none";
}

export default function Card({
  children,
  className = "",
  variant = "default",
}: CardProps) {
  const variants = {
    default: "shadow-sm rounded-2xl border border-border bg-card",
    elevated:
      "shadow-md transition-shadow duration-300 border border-border bg-card",
    interactive:
      "shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 cursor-pointer rounded-2xl border border-border bg-card",
    outline: "shadow-none border-2 rounded-2xl border border-border bg-card",
    none: "bg-transparent w-full max-w-sm",
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
 */
interface CardSubComponentProps {
  /** The content to display */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Header section of a Card component.
 */
export function CardHeader({
  children,
  className = "",
}: CardSubComponentProps) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

/**
 * Title element for use within CardHeader.
 */
export function CardTitle({ children, className = "" }: CardSubComponentProps) {
  return (
    <h3 className={`text-2xl font-medium text-foreground ${className}`}>
      {children}
    </h3>
  );
}

/**
 * Main content section of a Card component.
 */
export function CardContent({
  children,
  className = "",
}: CardSubComponentProps) {
  return <div className={className}>{children}</div>;
}

/**
 * Description text for use within Card.
 */
export function CardDescription({
  children,
  className = "",
}: CardSubComponentProps) {
  return (
    <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>
  );
}

/**
 * Footer section of a Card component.
 */
export function CardFooter({
  children,
  className = "",
}: CardSubComponentProps) {
  return (
    <div className={`mt-4 flex items-center gap-2 ${className}`}>
      {children}
    </div>
  );
}
