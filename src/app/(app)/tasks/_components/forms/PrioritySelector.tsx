/**
 * @fileoverview PrioritySelector component for choosing task priority.
 */

import { Priority } from '@/types';

interface PrioritySelectorProps {
    value: Priority | undefined;
    onChange: (value: Priority | undefined) => void;
}

const priorityOptions = [
    { value: 'high' as Priority, label: 'High', color: 'bg-error text-white' },
    { value: 'medium' as Priority, label: 'Medium', color: 'bg-warning text-white' },
    { value: 'low' as Priority, label: 'Low', color: 'bg-info text-white' },
];

export default function PrioritySelector({
    value,
    onChange,
}: PrioritySelectorProps) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                {priorityOptions.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(value === option.value ? undefined : option.value)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                            value === option.value
                                ? `${option.color} scale-105 shadow-md`
                                : 'bg-muted hover:bg-accent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
