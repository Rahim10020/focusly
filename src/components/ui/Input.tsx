/**
 * @fileoverview Input component with label, validation states, and helper text.
 */

import React, { useState } from "react";
import { HideIcon, InfoIcon, ShowIcon } from "@/components/shared/icons";
import CheckIcon from "@/components/shared/icons/CheckIcon";

/**
 * Props for the Input component.
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
  /** Whether to show a visibility toggle for password inputs */
  showPasswordToggle?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      success,
      helperText,
      noBorder,
      showPasswordToggle = false,
      className = "",
      type,
      ...props
    },
    ref,
  ) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const shouldShowPasswordToggle = showPasswordToggle && type === "password";
    const inputType = shouldShowPasswordToggle
      ? isPasswordVisible
        ? "text"
        : "password"
      : type;

    const borderColor = error
      ? "border-[var(--error)] focus:ring-[var(--error)]"
      : success
        ? "border-[var(--success)] focus:ring-[var(--success)]"
        : "border-border focus:ring-black-10 focus:bg-transparent";

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
            type={inputType}
            className={`w-full px-4 bg-black-5 h-9 text-foreground
                        ${noBorder ? "border-0" : "rounded-sm"}
                        ${shouldShowPasswordToggle ? "pr-10" : ""}
                        focus:outline-none focus:ring-2 focus:ring-offset-0
                        transition-all duration-300 ease-out
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${!noBorder ? borderColor : ""} ${className}`}
            {...props}
          />

          {shouldShowPasswordToggle && (
            <button
              type="button"
              onClick={() => setIsPasswordVisible((prev) => !prev)}
              className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 text-black-40 hover:text-foreground transition-colors"
              aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            >
              {isPasswordVisible ? <HideIcon /> : <ShowIcon />}
            </button>
          )}

          {success && !error && !shouldShowPasswordToggle && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <CheckIcon size={20} className="text-(--success)" />
            </div>
          )}

          {error && !shouldShowPasswordToggle && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <InfoIcon size={20} className="text-(--error)" />
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
