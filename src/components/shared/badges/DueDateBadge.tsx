/**
 * @fileoverview Badge component for displaying task due dates with contextual styling.
 */

import { TIME_MS } from "@/constants";

/**
 * Props for the DueDateBadge component.
 * @interface DueDateBadgeProps
 */
interface DueDateBadgeProps {
  /** Due date as Unix timestamp in milliseconds */
  dueDate: number;
  /** Whether the associated task is completed */
  completed?: boolean;
}

/**
 * A badge component that displays a due date with contextual formatting and styling.
 * Shows relative dates (Today, Tomorrow) and applies different styles based on urgency.
 *
 * @param {DueDateBadgeProps} props - The component props
 * @param {number} props.dueDate - Unix timestamp in milliseconds
 * @param {boolean} [props.completed] - Task completion status
 * @returns {JSX.Element} The rendered badge element
 *
 * @example
 * // Due today
 * <DueDateBadge dueDate={Date.now()} />
 *
 * @example
 * // Completed task
 * <DueDateBadge dueDate={1700000000000} completed={true} />
 *
 * @example
 * // Overdue task
 * <DueDateBadge dueDate={Date.now() - 86400000} />
 */
export default function DueDateBadge({
  dueDate,
  completed,
}: DueDateBadgeProps) {
  const now = Date.now();

  const isOverdue = dueDate < now && !completed;
  const isDueToday =
    new Date(dueDate).toDateString() === new Date(now).toDateString();
  const isTomorrow =
    new Date(dueDate).toDateString() ===
    new Date(now + TIME_MS.DAY).toDateString();

  const formatDate = () => {
    if (isDueToday) return "Today";
    if (isTomorrow) return "Tomorrow";

    const date = new Date(dueDate);
    const daysDiff = Math.floor((dueDate - now) / TIME_MS.DAY);

    if (daysDiff < 7 && daysDiff > 0) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    }

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getStyles = () => {
    if (completed) {
      return "bg-surface-muted text-text-muted border-border";
    }
    if (isOverdue) {
      return "bg-error text-white border-error";
    }
    if (isDueToday) {
      return "bg-warning text-white border-warning";
    }
    return "bg-surface-subtle text-foreground border-border";
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStyles()}`}
    >
      {formatDate()}
    </span>
  );
}
