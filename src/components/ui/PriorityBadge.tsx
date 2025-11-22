/**
 * @fileoverview Badge component for displaying task priority levels.
 */

import { Priority } from '@/types';

/**
 * Props for the PriorityBadge component.
 * @interface PriorityBadgeProps
 */
interface PriorityBadgeProps {
    /** The priority level to display */
    priority: Priority;
    /** Size variant of the badge */
    size?: 'sm' | 'md';
}

/**
 * Configuration object for priority badge styling.
 * @constant
 */
const PRIORITY_CONFIG = {
    high: {
        label: 'High',
        color: 'text-red-700 border-red-200',
        darkColor: 'dark:text-red-400 dark:border-red-800',
        icon: '🔴',
    },
    medium: {
        label: 'Medium',
        color: 'text-yellow-900 border-yellow-200',
        darkColor: 'dark:text-yellow-400 dark:border-yellow-800',
        icon: '🟡',
    },
    low: {
        label: 'Low',
        color: 'text-blue-700 border-blue-200',
        darkColor: 'dark:text-blue-400 dark:border-blue-800',
        icon: '🔵',
    },
};

/**
 * A badge component that displays the priority level of a task.
 * Shows colored indicators for high, medium, and low priorities.
 *
 * @param {PriorityBadgeProps} props - The component props
 * @param {Priority} props.priority - The priority level ('high', 'medium', 'low')
 * @param {('sm'|'md')} [props.size='sm'] - Badge size
 * @returns {JSX.Element} The rendered priority badge
 *
 * @example
 * // High priority badge
 * <PriorityBadge priority="high" />
 *
 * @example
 * // Medium priority with larger size
 * <PriorityBadge priority="medium" size="md" />
 */
export default function PriorityBadge({ priority, size = 'sm' }: PriorityBadgeProps) {
    const config = PRIORITY_CONFIG[priority];
    const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

    return (
        <span
            className={`inline-flex items-center gap-1 cursor-pointer rounded-full border font-medium ${config.color} ${config.darkColor} ${sizeClasses}`}
        >
            <span className="text-xs">{config.icon}</span>
            {config.label}
        </span>
    );
}