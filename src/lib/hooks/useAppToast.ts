/**
 * @fileoverview App-level toast helper hook.
 * Provides consistent wording for success/error/warning/info notifications.
 */

"use client";

import { useCallback } from "react";
import { useToastContext } from "@/components/providers/ToastProvider";

const DEFAULT_ERROR_MESSAGE = "Please try again.";

function getErrorMessage(cause: unknown, fallbackMessage: string): string {
  if (cause instanceof Error && cause.message.trim().length > 0) {
    return cause.message;
  }
  return fallbackMessage;
}

export function useAppToast() {
  const { success, error, warning, info } = useToastContext();

  const actionSuccess = useCallback(
    (message: string, title = "Success", duration?: number) => {
      return success(title, message, duration);
    },
    [success],
  );

  const actionError = useCallback(
    (
      cause: unknown,
      fallbackMessage = DEFAULT_ERROR_MESSAGE,
      title = "Action Failed",
      duration?: number,
    ) => {
      return error(title, getErrorMessage(cause, fallbackMessage), duration);
    },
    [error],
  );

  const validationError = useCallback(
    (message: string, title = "Validation Error", duration?: number) => {
      return warning(title, message, duration);
    },
    [warning],
  );

  const infoMessage = useCallback(
    (message: string, title = "Info", duration?: number) => {
      return info(title, message, duration);
    },
    [info],
  );

  return {
    actionSuccess,
    actionError,
    validationError,
    infoMessage,
  };
}
