/**
 * @fileoverview Toast/notification configuration.
 * Message display settings used throughout the application.
 */

import { TIME_MS } from "./time";

/** Common durations used by the toast system (in milliseconds). */
export const TOAST_DURATION = {
  SHORT: 3000,
  DEFAULT: 5000,
  LONG: 8000,
} as const;

/** @deprecated Use TOAST_DURATION.DEFAULT instead */
export const TOAST_DEFAULT_DURATION_MS = TOAST_DURATION.DEFAULT;

/** Toast message types */
export const TOAST_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  INFO: "info",
  WARNING: "warning",
} as const;

/** Common toast messages */
export const TOAST_MESSAGES = {
  SUCCESS: {
    TASK_CREATED: "Task created successfully",
    TASK_UPDATED: "Task updated",
    TASK_DELETED: "Task deleted",
  },
  ERROR: {
    TASK_CREATE_FAILED: "Failed to create task",
    TASK_UPDATE_FAILED: "Failed to update task",
    TASK_DELETE_FAILED: "Failed to delete task",
    GENERIC: "Something went wrong",
  },
} as const;
