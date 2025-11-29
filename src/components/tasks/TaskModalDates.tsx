/**
 * @fileoverview Dates component for TaskModal.
 * Handles start date, due date, start time, and end time with validation.
 */

'use client';

import { useEffect, useState } from 'react';
import Input from '@/components/ui/Input';

interface TaskModalDatesProps {
    task: {
        startDate?: string;
        dueDate?: string;
        startTime?: string;
        endTime?: string;
        estimatedDuration?: string;
    };
    onChange: (field: string, value: string) => void;
    onDurationChange: (duration: string) => void;
    errors?: {
        dates?: string;
    };
}

/**
 * TaskModalDates component for scheduling tasks.
 * Validates that start date is before due date.
 * Auto-calculates duration from start and end times.
 */
export const TaskModalDates = ({ task, onChange, onDurationChange, errors }: TaskModalDatesProps) => {
    const [localError, setLocalError] = useState<string | null>(null);

    const validateDates = (startDate?: string, dueDate?: string): string | null => {
        if (startDate && dueDate && new Date(startDate) > new Date(dueDate)) {
            return 'Start date must be before due date';
        }
        return null;
    };

    const handleStartDateChange = (value: string) => {
        onChange('startDate', value);
        const error = validateDates(value, task.dueDate);
        setLocalError(error);
    };

    const handleDueDateChange = (value: string) => {
        onChange('dueDate', value);
        const error = validateDates(task.startDate, value);
        setLocalError(error);
    };

    // Auto-calculate duration when times change
    useEffect(() => {
        if (!task.startTime || !task.endTime) return;

        try {
            const start = task.startTime.includes(':') ? task.startTime : `${task.startTime}:00`;
            const end = task.endTime.includes(':') ? task.endTime : `${task.endTime}:00`;

            const [startHours, startMinutes = 0] = start.split(':').map(Number);
            const [endHours, endMinutes = 0] = end.split(':').map(Number);

            if (isNaN(startHours) || isNaN(startMinutes) || isNaN(endHours) || isNaN(endMinutes)) {
                return;
            }

            const startDate = new Date();
            startDate.setHours(startHours, startMinutes, 0, 0);

            let endDate = new Date();
            endDate.setHours(endHours, endMinutes, 0, 0);

            if (endDate <= startDate) {
                endDate.setDate(endDate.getDate() + 1);
            }

            const diffInMs = endDate.getTime() - startDate.getTime();
            const diffInMinutes = Math.round(diffInMs / (1000 * 60));

            if (diffInMinutes > 0) {
                onDurationChange(diffInMinutes.toString());
            }
        } catch (error) {
            console.error('Error calculating duration:', error);
        }
    }, [task.startTime, task.endTime, onDurationChange]);

    const displayError = localError || errors?.dates;

    return (
        <div className="space-y-6">
            <h3 className="text-base font-semibold text-foreground">Schedule & Duration</h3>

            <div className="bg-muted/30 rounded-xl p-5 space-y-5">
                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Start Date
                        </label>
                        <Input
                            type="date"
                            value={task.startDate || ''}
                            onChange={(e) => handleStartDateChange(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className={`bg-background border-border ${displayError ? 'border-error' : ''}`}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Due Date
                        </label>
                        <Input
                            type="date"
                            value={task.dueDate || ''}
                            onChange={(e) => handleDueDateChange(e.target.value)}
                            min={task.startDate || new Date().toISOString().split('T')[0]}
                            className={`bg-background border-border ${displayError ? 'border-error' : ''}`}
                        />
                    </div>
                </div>

                {displayError && (
                    <p className="text-sm text-error">{displayError}</p>
                )}

                {/* Times and Duration */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Start Time
                        </label>
                        <Input
                            type="time"
                            value={task.startTime || ''}
                            onChange={(e) => onChange('startTime', e.target.value)}
                            className="bg-background border-border"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            End Time
                        </label>
                        <Input
                            type="time"
                            value={task.endTime || ''}
                            onChange={(e) => onChange('endTime', e.target.value)}
                            className="bg-background border-border"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Duration (min)
                        </label>
                        <Input
                            type="number"
                            value={task.estimatedDuration || ''}
                            onChange={(e) => onDurationChange(e.target.value)}
                            min="0"
                            placeholder="60"
                            className="bg-background border-border"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
