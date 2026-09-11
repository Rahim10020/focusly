/**
 * @fileoverview TaskModal component for creating and editing tasks.
 * Provides a comprehensive form with fields for title, priority, dates, times,
 * duration, categories, and subtasks. Supports fullscreen mode.
 */

"use client";

import { useState } from "react";
import TaskModalHeader from "./TaskModalHeader";
import TaskFormContent from "./TaskFormContent";
import TaskFormContentFullscreen from "./TaskFormContentFullscreen";
import TaskModalFooter from "./TaskModalFooter";
import { Priority, SubDomain } from "@/types";

/**
 * Props for the TaskModal component.
 */
interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: TaskFormData) => void;
  initialData?: TaskFormData;
}

/**
 * Form data structure for creating or editing a task.
 */
export interface TaskFormData {
  title: string;
  priority?: Priority;
  tags?: string[];
  dueDate?: number;
  startDate?: number;
  startTime?: string;
  endTime?: string;
  estimatedDuration?: number;
  notes?: string;
  subDomain?: SubDomain;
  /** Array of subtasks with title and completion status */
  subTasks?: { title: string; completed: boolean }[];
  isRecurring?: boolean;
  recurrencePattern?: "daily" | "weekly" | "monthly" | "custom";
  recurrenceInterval?: number;
  recurrenceDaysOfWeek?: number[];
  recurrenceEndDate?: string;
}

/**
 * TaskModal component provides a form for creating new tasks or editing existing ones.
 * Features include priority selection, date/time scheduling, duration calculation,
 * category selection, and subtask management.
 * Supports both compact and fullscreen modes.
 */
export default function TaskModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: TaskModalProps) {
  if (!isOpen) return null;

  const resetKey = initialData ? JSON.stringify(initialData) : "new";

  return (
    <TaskModalContent
      key={resetKey}
      onClose={onClose}
      onSave={onSave}
      initialData={initialData}
    />
  );
}

function TaskModalContent({
  onClose,
  onSave,
  initialData,
}: Omit<TaskModalProps, "isOpen">) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [title, setTitle] = useState(() => initialData?.title || "");
  const [priority, setPriority] = useState<Priority | undefined>(
    () => initialData?.priority,
  );
  const [selectedTags] = useState<string[]>(() => initialData?.tags || []);
  const [dueDate, setDueDate] = useState(() =>
    initialData?.dueDate
      ? new Date(initialData.dueDate).toISOString().split("T")[0]
      : "",
  );
  const [startDate, setStartDate] = useState(() =>
    initialData?.startDate
      ? new Date(initialData.startDate).toISOString().split("T")[0]
      : "",
  );
  const [startTime, setStartTime] = useState(
    () => initialData?.startTime || "",
  );
  const [endTime, setEndTime] = useState(() => initialData?.endTime || "");
  const [estimatedDuration, setEstimatedDuration] = useState(
    () => initialData?.estimatedDuration?.toString() || "",
  );
  const [notes] = useState(() => initialData?.notes || "");
  const [selectedSubDomain, setSelectedSubDomain] = useState<
    SubDomain | undefined
  >(() => initialData?.subDomain);
  const [subTasks, setSubTasks] = useState<
    { title: string; completed: boolean }[]
  >(() => initialData?.subTasks || []);
  const [isRecurring, setIsRecurring] = useState(
    () => initialData?.isRecurring || false,
  );
  const [recurrencePattern, setRecurrencePattern] = useState<
    "daily" | "weekly" | "monthly" | "custom"
  >(() => initialData?.recurrencePattern || "daily");
  const [recurrenceInterval, setRecurrenceInterval] = useState(
    () => initialData?.recurrenceInterval?.toString() || "1",
  );
  const [recurrenceDaysOfWeek, setRecurrenceDaysOfWeek] = useState<number[]>(
    () => initialData?.recurrenceDaysOfWeek || [1, 3, 5],
  );
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(
    () => initialData?.recurrenceEndDate || "",
  );

  const handleSubmit = () => {
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      priority,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
      startDate: startDate ? new Date(startDate).getTime() : undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      estimatedDuration: estimatedDuration
        ? parseInt(estimatedDuration)
        : undefined,
      notes: notes.trim() || undefined,
      subDomain: selectedSubDomain,
      subTasks: subTasks.length > 0 ? subTasks : undefined,
      isRecurring: isRecurring || undefined,
      recurrencePattern: isRecurring ? recurrencePattern : undefined,
      recurrenceInterval: isRecurring
        ? parseInt(recurrenceInterval) || 1
        : undefined,
      recurrenceDaysOfWeek:
        isRecurring && recurrencePattern === "custom"
          ? recurrenceDaysOfWeek
          : undefined,
      recurrenceEndDate:
        isRecurring && recurrenceEndDate ? recurrenceEndDate : undefined,
    });

    onClose();
  };

  const modalClasses = isFullScreen
    ? "fixed inset-0 z-50 bg-background"
    : "fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-sm";

  const contentClasses = isFullScreen
    ? "w-full h-full bg-card border-0 rounded-none shadow-none overflow-y-auto"
    : "w-full max-w-2xl max-h-[90vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden";

  return (
    <div className={modalClasses}>
      <div className={contentClasses}>
        <TaskModalHeader
          isEditing={!!initialData}
          isFullScreen={isFullScreen}
          onFullScreenToggle={() => setIsFullScreen(!isFullScreen)}
          onClose={onClose}
          selectedSubDomain={selectedSubDomain}
          onSubDomainChange={setSelectedSubDomain}
          subTasks={subTasks}
          onSubTasksChange={setSubTasks}
        />

        {/* Content */}
        <div
          className={`${isFullScreen ? "p-6 space-y-8" : "p-6"}`}
        >
          {!isFullScreen && (
            <TaskFormContent
              title={title}
              priority={priority}
              startDate={startDate}
              dueDate={dueDate}
              startTime={startTime}
              endTime={endTime}
              estimatedDuration={estimatedDuration}
              isRecurring={isRecurring}
              recurrencePattern={recurrencePattern}
              recurrenceInterval={recurrenceInterval}
              recurrenceDaysOfWeek={recurrenceDaysOfWeek}
              recurrenceEndDate={recurrenceEndDate}
              onTitleChange={setTitle}
              onPriorityChange={setPriority}
              onStartDateChange={setStartDate}
              onDueDateChange={setDueDate}
              onStartTimeChange={setStartTime}
              onEndTimeChange={setEndTime}
              onDurationChange={setEstimatedDuration}
              onIsRecurringChange={setIsRecurring}
              onRecurrencePatternChange={setRecurrencePattern}
              onRecurrenceIntervalChange={setRecurrenceInterval}
              onRecurrenceDaysOfWeekChange={setRecurrenceDaysOfWeek}
              onRecurrenceEndDateChange={setRecurrenceEndDate}
            />
          )}

          {isFullScreen && (
            <TaskFormContentFullscreen
              title={title}
              priority={priority}
              startDate={startDate}
              dueDate={dueDate}
              startTime={startTime}
              endTime={endTime}
              estimatedDuration={estimatedDuration}
              isRecurring={isRecurring}
              recurrencePattern={recurrencePattern}
              recurrenceInterval={recurrenceInterval}
              recurrenceDaysOfWeek={recurrenceDaysOfWeek}
              recurrenceEndDate={recurrenceEndDate}
              onTitleChange={setTitle}
              onPriorityChange={setPriority}
              onStartDateChange={setStartDate}
              onDueDateChange={setDueDate}
              onStartTimeChange={setStartTime}
              onEndTimeChange={setEndTime}
              onDurationChange={setEstimatedDuration}
              onIsRecurringChange={setIsRecurring}
              onRecurrencePatternChange={setRecurrencePattern}
              onRecurrenceIntervalChange={setRecurrenceInterval}
              onRecurrenceDaysOfWeekChange={setRecurrenceDaysOfWeek}
              onRecurrenceEndDateChange={setRecurrenceEndDate}
            />
          )}
        </div>

        {/* Footer */}
        <TaskModalFooter
          isEditing={!!initialData}
          isValid={!!title.trim()}
          onClose={onClose}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
