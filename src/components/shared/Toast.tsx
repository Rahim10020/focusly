/**
 * @fileoverview Toast notification component with auto-dismiss functionality.
 */

"use client";

import { useEffect } from "react";
import CheckIcon from "@/components/shared/icons/CheckIcon";
import { CloseLgIcon, InfoIcon } from "@/components/shared/icons";
import WarningIcon from "@/components/shared/icons/WarningIcon";
import { TOAST_DEFAULT_DURATION_MS } from "@/constants";

/**
 * Props for the Toast component.
 * @interface ToastProps
 * @exports
 */
export interface ToastProps {
  /** Unique identifier for the toast */
  id: string;
  /** Visual style and icon variant */
  type: "success" | "error" | "warning" | "info";
  /** Main message title */
  title: string;
  /** Optional additional description */
  description?: string;
  /** Auto-dismiss duration in milliseconds (0 to disable) */
  duration?: number;
  /** Callback when toast is closed */
  onClose: (id: string) => void;
}

const icons = {
  success: <CheckIcon size={20} />,
  error: <CloseLgIcon size={20} />,
  warning: <WarningIcon size={20} />,
  info: <InfoIcon size={20} />,
};

const styles = {
  success: "bg-success text-white",
  error: "bg-error text-white",
  warning: "bg-warning text-white",
  info: "bg-info text-white",
};

/**
 * A toast notification component for displaying temporary messages.
 * Supports multiple types (success, error, warning, info) with appropriate icons.
 * Auto-dismisses after specified duration.
 *
 * @param {ToastProps} props - The component props
 * @param {string} props.id - Unique identifier
 * @param {('success'|'error'|'warning'|'info')} props.type - Toast type
 * @param {string} props.title - Main message
 * @param {string} [props.description] - Additional description
 * @param {number} [props.duration=5000] - Auto-dismiss time in ms
 * @param {Function} props.onClose - Close callback
 * @returns {JSX.Element} The rendered toast element
 *
 * @example
 * // Success toast
 * <Toast
 *   id="1"
 *   type="success"
 *   title="Task completed"
 *   onClose={handleClose}
 * />
 *
 * @example
 * // Error toast with description
 * <Toast
 *   id="2"
 *   type="error"
 *   title="Failed to save"
 *   description="Please check your connection"
 *   duration={10000}
 *   onClose={handleClose}
 * />
 */
export default function Toast({
  id,
  type,
  title,
  description,
  duration = TOAST_DEFAULT_DURATION_MS,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl shadow-lg ${styles[type]} animate-slide-up min-w-[320px] max-w-md`}
      role="alert"
    >
      <div className="shrink-0 mt-0.5">{icons[type]}</div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{title}</p>
        {description && (
          <p className="text-sm opacity-90 mt-1">{description}</p>
        )}
      </div>
      <button
        onClick={() => onClose(id)}
        className="shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
        aria-label="Close notification"
      >
        <CloseLgIcon size={20} />
      </button>
    </div>
  );
}
