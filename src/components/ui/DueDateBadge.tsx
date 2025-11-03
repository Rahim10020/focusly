interface DueDateBadgeProps {
    dueDate: number;
    completed?: boolean;
}

export default function DueDateBadge({ dueDate, completed }: DueDateBadgeProps) {
    const now = Date.now();
    const isOverdue = dueDate < now && !completed;
    const isDueToday = new Date(dueDate).toDateString() === new Date().toDateString();
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
            return 'bg-muted text-muted-foreground border-muted';
        }
        if (isOverdue) {
            return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
        }
        if (isDueToday) {
            return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
        }
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
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