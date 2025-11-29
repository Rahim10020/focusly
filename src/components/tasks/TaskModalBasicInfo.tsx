/**
 * @fileoverview Basic info component for TaskModal.
 * Handles title and description inputs.
 */

'use client';

import Input from '@/components/ui/Input';

interface TaskModalBasicInfoProps {
    task: {
        title: string;
        notes?: string;
    };
    onChange: (field: string, value: string) => void;
    errors?: {
        title?: string;
    };
}

/**
 * TaskModalBasicInfo component for task title and notes.
 * Displays error messages for validation failures.
 */
export const TaskModalBasicInfo = ({ task, onChange, errors }: TaskModalBasicInfoProps) => (
    <div className="space-y-4">
        <div className="space-y-2">
            <input
                type="text"
                value={task.title}
                onChange={(e) => onChange('title', e.target.value)}
                placeholder="What needs to be done?"
                autoFocus
                className={`w-full text-2xl font-medium bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 border-0 p-0 ${errors?.title ? 'text-error' : ''
                    }`}
            />
            {errors?.title && (
                <p className="text-sm text-error mt-1">{errors.title}</p>
            )}
        </div>

        <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Notes</label>
            <textarea
                value={task.notes || ''}
                onChange={(e) => onChange('notes', e.target.value)}
                placeholder="Add any additional details..."
                className="w-full px-4 py-3 bg-muted text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none min-h-[120px] transition-all"
                rows={4}
            />
        </div>
    </div>
);
