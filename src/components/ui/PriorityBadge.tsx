import { Priority } from '@/types';

interface PriorityBadgeProps {
    priority: Priority;
    size?: 'sm' | 'md';
}

const PRIORITY_CONFIG = {
    high: {
        label: 'High',
        color: 'bg-red-100 text-red-700 border-red-200',
        darkColor: 'dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
        icon: '🔴',
    },
    medium: {
        label: 'Medium',
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        darkColor: 'dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
        icon: '🟡',
    },
    low: {
        label: 'Low',
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        darkColor: 'dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
        icon: '🔵',
    },
};

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