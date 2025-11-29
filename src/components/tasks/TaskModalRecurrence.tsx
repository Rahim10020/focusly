/**
 * @fileoverview Recurrence component for TaskModal.
 * Allows users to configure recurring tasks.
 */

'use client';

import Input from '@/components/ui/Input';

interface TaskModalRecurrenceProps {
    task: {
        isRecurring?: boolean;
        recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'custom';
        recurrenceInterval?: number;
        recurrenceDaysOfWeek?: number[];
        recurrenceEndDate?: string;
    };
    onChange: (field: string, value: any) => void;
}

/**
 * TaskModalRecurrence component for configuring recurring tasks.
 * Supports daily, weekly, monthly, and custom patterns.
 */
export const TaskModalRecurrence = ({ task, onChange }: TaskModalRecurrenceProps) => {
    const daysOfWeek = [
        { value: 0, label: 'Sun' },
        { value: 1, label: 'Mon' },
        { value: 2, label: 'Tue' },
        { value: 3, label: 'Wed' },
        { value: 4, label: 'Thu' },
        { value: 5, label: 'Fri' },
        { value: 6, label: 'Sat' },
    ];

    const toggleDay = (day: number) => {
        const current = task.recurrenceDaysOfWeek || [];
        const newDays = current.includes(day)
            ? current.filter((d) => d !== day)
            : [...current, day];
        onChange('recurrenceDaysOfWeek', newDays);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center space-x-2">
                <input
                    type="checkbox"
                    id="is_recurring"
                    checked={task.isRecurring || false}
                    onChange={(e) => onChange('isRecurring', e.target.checked)}
                    className="w-4 h-4 text-primary border-border rounded focus:ring-primary cursor-pointer"
                />
                <label htmlFor="is_recurring" className="text-sm font-medium text-foreground cursor-pointer">
                    Recurring Task
                </label>
            </div>

            {task.isRecurring && (
                <div className="space-y-4 ml-6 border-l-2 border-primary/30 pl-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground">Frequency</label>
                        <select
                            value={task.recurrencePattern || 'daily'}
                            onChange={(e) => onChange('recurrencePattern', e.target.value)}
                            className="w-full px-3 py-2 bg-background text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>

                    {task.recurrencePattern === 'custom' && (
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-foreground">Days of the Week</label>
                            <div className="flex gap-2">
                                {daysOfWeek.map((day) => (
                                    <button
                                        key={day.value}
                                        type="button"
                                        onClick={() => toggleDay(day.value)}
                                        className={`px-3 py-1 rounded-md text-sm font-medium transition-all cursor-pointer ${(task.recurrenceDaysOfWeek || []).includes(day.value)
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-secondary text-secondary-foreground hover:bg-accent'
                                            }`}
                                    >
                                        {day.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground">Interval</label>
                        <Input
                            type="number"
                            min={1}
                            value={task.recurrenceInterval || 1}
                            onChange={(e) => onChange('recurrenceInterval', parseInt(e.target.value) || 1)}
                            className="bg-background border-border"
                        />
                        <p className="text-sm text-muted-foreground">
                            Repeat every {task.recurrenceInterval || 1}{' '}
                            {task.recurrencePattern === 'daily'
                                ? 'day(s)'
                                : task.recurrencePattern === 'weekly'
                                    ? 'week(s)'
                                    : task.recurrencePattern === 'monthly'
                                        ? 'month(s)'
                                        : 'occurrence(s)'}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground">End Date (optional)</label>
                        <Input
                            type="date"
                            value={task.recurrenceEndDate || ''}
                            onChange={(e) => onChange('recurrenceEndDate', e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="bg-background border-border"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
