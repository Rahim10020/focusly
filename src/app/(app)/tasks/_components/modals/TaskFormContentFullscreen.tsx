/**
 * @fileoverview TaskModalFullscreen component for fullscreen mode content.
 */

import TaskTitleInput from "../forms/TaskTitleInput";
import PrioritySelector from "../forms/PrioritySelector";
import ScheduleDuration from "../forms/ScheduleDuration";
import { Priority } from "@/types";

interface TaskModalFullscreenProps {
  title: string;
  priority: Priority | undefined;
  startDate: string;
  dueDate: string;
  startTime: string;
  endTime: string;
  estimatedDuration: string;
  onTitleChange: (value: string) => void;
  onPriorityChange: (value: Priority | undefined) => void;
  onStartDateChange: (value: string) => void;
  onDueDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onDurationChange: (value: string) => void;
}

export default function TaskModalFullscreen({
  title,
  priority,
  startDate,
  dueDate,
  startTime,
  endTime,
  estimatedDuration,
  onTitleChange,
  onPriorityChange,
  onStartDateChange,
  onDueDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onDurationChange,
}: TaskModalFullscreenProps) {
  return (
    <div className="space-y-8">
      <TaskTitleInput value={title} onChange={onTitleChange} autoFocus />

      <PrioritySelector value={priority} onChange={onPriorityChange} />

      <div className="border-t border-border" />

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
    </div>
  );
}
