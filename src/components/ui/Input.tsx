/**
 * @fileoverview Input component with label, validation states, and helper text.
 */

import React from "react";

/**
 * Props for the Input component.
 * @interface InputProps
 * @extends {Omit<React.InputHTMLAttributes<HTMLInputElement>, 'ref'>}
 */
interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "ref"
> {
  /** Label text displayed above the input */
  label?: string;
  /** Error message to display below the input */
  error?: string;
  /** Whether to show success state styling */
  success?: boolean;
  /** Helper text displayed below the input */
  helperText?: string;
  /** Whether to render without border */
  noBorder?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, success, helperText, noBorder, className = "", ...props },
    ref,
  ) => {
    const borderColor = error
      ? "border-[var(--error)] focus:ring-[var(--error)]"
      : success
        ? "border-[var(--success)] focus:ring-[var(--success)]"
        : "border-border focus:ring-primary";

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-normal text-black-40 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={`w-full px-4 bg-black-5 py-2.5 text-foreground
                        ${noBorder ? "border-0" : "border-2 rounded-sm"}
                        focus:outline-none focus:ring-2 focus:ring-offset-0
                        placeholder:text-muted-foreground
                        transition-all duration-300 ease-out
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${!noBorder ? borderColor : ""} ${className}`}
            {...props}
          />
          {success && !error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg
                className="w-5 h-5 text-(--success)"
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
                className="w-5 h-5 text-(--error)"
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
          <p className="mt-1.5 text-sm text-(--error) flex items-center gap-1">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
