/**
 * @fileoverview Badge component for displaying task due dates with contextual styling.
 */

import { useMemo } from 'react';

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
export default function DueDateBadge({ dueDate, completed }: DueDateBadgeProps) {
    const now = useMemo(() => Date.now(), []);
    const isOverdue = dueDate < now && !completed;
    const isDueToday = new Date(dueDate).toDateString() === new Date(now).toDateString();
    const isTomorrow = new Date(dueDate).toDateString() === new Date(now + 24 * 60 * 60 * 1000).toDateString();

    const formatDate = () => {
        if (isDueToday) return 'Today';
        if (isTomorrow) return 'Tomorrow';

        const date = new Date(dueDate);
        const daysDiff = Math.floor((dueDate - now) / (1000 * 60 * 60 * 24));

        if (daysDiff < 7 && daysDiff > 0) {
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        }

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getStyles = () => {
        if (completed) {
            return 'bg-gray-300 text-gray-600 border-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:border-gray-600';
        }
        if (isOverdue) {
            return 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white';
        }
        if (isDueToday) {
            return 'bg-gray-500 text-white border-gray-500 dark:bg-gray-400 dark:text-black dark:border-gray-400';
        }
        return 'bg-gray-300 text-black border-gray-300 dark:bg-gray-600 dark:text-white dark:border-gray-600';
    };

    const getIcon = () => {
        if (isOverdue) return '⚠️';
        if (isDueToday) return '📅';
        if (isTomorrow) return '⏰';
        return '📆';
    };

    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStyles()}`}
        >
            <span>{getIcon()}</span>
            {formatDate()}
        </span>
    );
}