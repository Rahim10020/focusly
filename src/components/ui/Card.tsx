import { ReactNode, type CSSProperties } from "react";

/**
 * Props for the Card component.
 */
interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "interactive" | "outline" | "none";
  style?: CSSProperties;
}

export default function Card({
  children,
  className = "",
  variant = "default",
  style,
}: CardProps) {
  const variants = {
    default: "shadow-sm rounded-2xl bg-card p-6",
    elevated: "shadow-md transition-shadow duration-300 bg-card p-6",
    interactive:
      "shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 cursor-pointer rounded-2xl bg-card p-6",
    outline: "shadow-none rounded-2xl border border-border bg-card p-6",
    none: "bg-transparent w-full max-w-sm p-6",
    special: "",
  };

  return (
    <div
      className={`text-card-foreground smooth-transition ${variants[variant]} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

/**
 * Props for Card sub-components.
 */
interface CardSubComponentProps {
  children: ReactNode;
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
    <h3
      className={`text-4xl lg:text-3xl font-medium text-foreground ${className}`}
    >
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
    <p className={`text-md text-foreground font-normal ${className}`}>
      {children}
    </p>
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
