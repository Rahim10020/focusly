/**
 * @fileoverview Button component with multiple variants, sizes, and loading state.
 */

import React, { forwardRef } from "react";
import { LoadingIcon } from "@/components/shared/icons";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "ghost"
    | "outline"
    | "danger"
    | "success";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      className = "",
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "rounded-full cursor-pointer font-normal transition-all duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale focus-ring inline-flex items-center justify-center gap-2";

    const variants = {
      primary:
        "bg-primary text-primary-foreground hover:bg-brand-primary active:scale-[0.98]",
      secondary: "bg-muted text-foreground hover:bg-accent active:scale-[0.98]",
      ghost:
        "bg-transparent text-foreground hover:bg-muted active:scale-[0.98]",
      outline:
        "bg-transparent border-2 !border-primary text-primary hover:bg-primary hover:text-primary-foreground active:scale-[0.98]",
      danger: "bg-error text-white hover:bg-error-light active:scale-[0.98]",
      success:
        "bg-success text-white hover:bg-success-light active:scale-[0.98]",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs md:text-sm h-8",
      md: "px-5 py-2.5 text-sm md:text-base h-10",
      lg: "px-6 py-3 text-base md:text-lg h-12",
    };

    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        role="button"
        {...props}
      >
        {loading && (
          <LoadingIcon size={16} className="mx-auto loading-icon-swing" />
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
