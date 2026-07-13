/**
 * @fileoverview TaskModalDetails component for compact mode form fields.
 */

import TaskTitleInput from "../forms/TaskTitleInput";
import PrioritySelector from "../forms/PrioritySelector";
import ScheduleDuration from "../forms/ScheduleDuration";
import { Priority } from "@/types";

interface TaskModalDetailsProps {
  title: string;
  priority: Priority | undefined;
  startDate: string;
  dueDate: string;
  startTime: string;
  endTime: string;
  estimatedDuration: string;
  isRecurring: boolean;
  recurrencePattern: 'daily' | 'weekly' | 'monthly' | 'custom';
  recurrenceInterval: string;
  recurrenceDaysOfWeek: number[];
  recurrenceEndDate: string;
  onTitleChange: (value: string) => void;
  onPriorityChange: (value: Priority | undefined) => void;
  onStartDateChange: (value: string) => void;
  onDueDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onDurationChange: (value: string) => void;
  onIsRecurringChange: (value: boolean) => void;
  onRecurrencePatternChange: (value: 'daily' | 'weekly' | 'monthly' | 'custom') => void;
  onRecurrenceIntervalChange: (value: string) => void;
  onRecurrenceDaysOfWeekChange: (value: number[]) => void;
  onRecurrenceEndDateChange: (value: string) => void;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function TaskModalDetails({
  title,
  priority,
  startDate,
  dueDate,
  startTime,
  endTime,
  estimatedDuration,
  isRecurring,
  recurrencePattern,
  recurrenceInterval,
  recurrenceDaysOfWeek,
  recurrenceEndDate,
  onTitleChange,
  onPriorityChange,
  onStartDateChange,
  onDueDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onDurationChange,
  onIsRecurringChange,
  onRecurrencePatternChange,
  onRecurrenceIntervalChange,
  onRecurrenceDaysOfWeekChange,
  onRecurrenceEndDateChange,
}: TaskModalDetailsProps) {
  const toggleDay = (day: number) => {
    if (recurrenceDaysOfWeek.includes(day)) {
      onRecurrenceDaysOfWeekChange(recurrenceDaysOfWeek.filter((d) => d !== day));
    } else {
      onRecurrenceDaysOfWeekChange([...recurrenceDaysOfWeek, day]);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <TaskTitleInput value={title} onChange={onTitleChange} autoFocus />

      <div className="flex flex-col items-start gap-2">
        <PrioritySelector value={priority} onChange={onPriorityChange} />
      </div>

      <ScheduleDuration
        startDate={startDate}
        dueDate={dueDate}
        startTime={startTime}
        endTime={endTime}
        estimatedDuration={estimatedDuration}
        onStartDateChange={onStartDateChange}
        onDueDateChange={onDueDateChange}
        onStartTimeChange={onStartTimeChange}
        onEndTimeChange={onEndTimeChange}
        onDurationChange={onDurationChange}
      />

      <div className="border-t border-border pt-6 space-y-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isRecurring"
            checked={isRecurring}
            onChange={(e) => onIsRecurringChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="isRecurring" className="text-sm font-medium text-foreground cursor-pointer">
            Recurring task
          </label>
        </div>

        {isRecurring && (
          <div className="space-y-4 pl-7">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Repeat</label>
              <select
                value={recurrencePattern}
                onChange={(e) => onRecurrencePatternChange(e.target.value as 'daily' | 'weekly' | 'monthly' | 'custom')}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Every</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={recurrenceInterval}
                  onChange={(e) => onRecurrenceIntervalChange(e.target.value)}
                  className="w-20 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="text-sm text-muted-foreground">
                  {recurrencePattern === 'daily' ? (parseInt(recurrenceInterval) === 1 ? 'day' : 'days') : recurrencePattern === 'weekly' ? (parseInt(recurrenceInterval) === 1 ? 'week' : 'weeks') : recurrencePattern === 'monthly' ? (parseInt(recurrenceInterval) === 1 ? 'month' : 'months') : ''}
                </span>
              </div>
            </div>

            {recurrencePattern === 'custom' && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">Days of week</label>
                <div className="flex gap-2">
                  {DAYS_OF_WEEK.map((day, index) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(index)}
                      className={`h-8 w-8 rounded-full text-xs font-medium transition-colors ${
                        recurrenceDaysOfWeek.includes(index)
                          ? "bg-primary text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">End date (optional)</label>
              <input
                type="date"
                value={recurrenceEndDate}
                onChange={(e) => onRecurrenceEndDateChange(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
