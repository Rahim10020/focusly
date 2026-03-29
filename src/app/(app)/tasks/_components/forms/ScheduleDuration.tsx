/**
 * @fileoverview ScheduleDuration component for task scheduling.
 */

import { useEffect } from "react";
import Input from "@/components/ui/Input";

interface ScheduleDurationProps {
  startDate: string;
  dueDate: string;
  startTime: string;
  endTime: string;
  estimatedDuration: string;
  onStartDateChange: (value: string) => void;
  onDueDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onDurationChange: (value: string) => void;
}

export default function ScheduleDuration({
  startDate,
  dueDate,
  startTime,
  endTime,
  estimatedDuration,
  onStartDateChange,
  onDueDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onDurationChange,
}: ScheduleDurationProps) {
  // Calculate duration when start time or end time changes
  useEffect(() => {
    const calculateDuration = () => {
      if (!startTime || !endTime) return;

      try {
        const start = startTime.includes(":") ? startTime : `${startTime}:00`;
        const end = endTime.includes(":") ? endTime : `${endTime}:00`;

        const [startHours, startMinutes = 0] = start.split(":").map(Number);
        const [endHours, endMinutes = 0] = end.split(":").map(Number);

        if (
          isNaN(startHours) ||
          isNaN(startMinutes) ||
          isNaN(endHours) ||
          isNaN(endMinutes)
        ) {
          return;
        }

        const startDateObj = new Date();
        startDateObj.setHours(startHours, startMinutes, 0, 0);

        const endDateObj = new Date();
        endDateObj.setHours(endHours, endMinutes, 0, 0);

        if (endDateObj <= startDateObj) {
          endDateObj.setDate(endDateObj.getDate() + 1);
        }

        const diffInMs = endDateObj.getTime() - startDateObj.getTime();
        const diffInMinutes = Math.round(diffInMs / (1000 * 60));

        if (diffInMinutes > 0) {
          onDurationChange(diffInMinutes.toString());
        } else if (diffInMinutes < 0) {
          onDurationChange("");
        }
      } catch {
        // Silent error
      }
    };

    calculateDuration();
  }, [startTime, endTime, onDurationChange]);

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      <h3 className="text-base font-semibold text-foreground">
        Schedule & Duration
      </h3>

      <div className="bg-muted/30 rounded-xl p-5 space-y-5">
        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Start Date
            </label>
            <div className="relative">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                min={today}
                className="bg-background border-border"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Due Date
            </label>
            <div className="relative">
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => onDueDateChange(e.target.value)}
                min={today}
                className="bg-background border-border"
              />
            </div>
          </div>
        </div>

        {/* Times and Duration */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Start Time
            </label>
            <div className="relative">
              <Input
                type="time"
                value={startTime}
                onChange={(e) => onStartTimeChange(e.target.value)}
                className="bg-background border-border"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">
              End Time
            </label>
            <div className="relative">
              <Input
                type="time"
                value={endTime}
                onChange={(e) => onEndTimeChange(e.target.value)}
                className="bg-background border-border"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Duration (min)
            </label>
            <Input
              type="number"
              value={estimatedDuration}
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
}
