"use client";

import { useState } from "react";
import { ArrowLeftLgIcon } from "@/components/shared/icons";
import { Priority, SubDomain, Task } from "@/types";
import { DateTimeService } from "@/lib/domain/services/DateTimeService";
import TaskModalHeader from "./TaskModalHeader";
import TaskFormContent from "./TaskFormContent";
import TaskViewFooter from "./details/TaskViewFooter";
import { TaskMetaInfo } from "../items/TaskMetaInfo";
import MobileTaskOptions from "./MobileTaskOptions";

interface MobileTaskEditPageProps {
  task: Task;
  onClose: () => void;
  onUpdate: (updates: Partial<Task>) => void;
  onAddSubTask: (title: string) => void;
  onToggleSubTask: (subTaskId: string) => void;
  onDeleteSubTask: (subTaskId: string) => void;
}

export default function MobileTaskEditPage({ task, onClose, onUpdate, onAddSubTask, onToggleSubTask, onDeleteSubTask }: MobileTaskEditPageProps) {
  const [title, setTitle] = useState(task.title || "");
  const [priority, setPriority] = useState<Priority | undefined>(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
  const [startDate, setStartDate] = useState(task.startDate ? new Date(task.startDate).toISOString().split("T")[0] : "");
  const [startTime, setStartTime] = useState(task.startTime || "");
  const [endTime, setEndTime] = useState(task.endTime || "");
  const [estimatedDuration, setEstimatedDuration] = useState(task.estimatedDuration?.toString() || "");
  const [selectedSubDomain, setSelectedSubDomain] = useState<SubDomain | undefined>(task.subDomain);
  const [subTasks, setSubTasks] = useState(task.subTasks || []);
  const [isRecurring, setIsRecurring] = useState(task.isRecurring || false);
  const [recurrencePattern, setRecurrencePattern] = useState<"daily" | "weekly" | "monthly" | "custom">(task.recurrencePattern || "daily");
  const [recurrenceInterval, setRecurrenceInterval] = useState((task.recurrenceInterval || 1).toString());
  const [recurrenceDaysOfWeek, setRecurrenceDaysOfWeek] = useState<number[]>(task.recurrenceDaysOfWeek || [1, 3, 5]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(task.recurrenceEndDate || "");

  const handleSave = () => onUpdate({
    title: title.trim(), priority,
    dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
    startDate: startDate ? new Date(startDate).getTime() : undefined,
    startTime: startTime || undefined, endTime: endTime || undefined,
    estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : undefined,
    subDomain: selectedSubDomain, isRecurring: isRecurring || undefined,
    recurrencePattern: isRecurring ? recurrencePattern : undefined,
    recurrenceInterval: isRecurring ? parseInt(recurrenceInterval) || 1 : undefined,
    recurrenceDaysOfWeek: isRecurring && recurrencePattern === "custom" ? recurrenceDaysOfWeek : undefined,
    recurrenceEndDate: isRecurring && recurrenceEndDate ? recurrenceEndDate : undefined,
  });

  const handleStartTimeChange = (value: string) => {
    setStartTime(value);
    const duration = DateTimeService.calculateTimeDuration(value, endTime);
    if (duration !== null) setEstimatedDuration(duration);
  };
  const handleEndTimeChange = (value: string) => {
    setEndTime(value);
    const duration = DateTimeService.calculateTimeDuration(startTime, value);
    if (duration !== null) setEstimatedDuration(duration);
  };

  const handleSubTasksChange = (nextSubTasks: { id?: string; title: string; completed: boolean }[]) => {
    const previousSubTasks = subTasks;
    const changedAt = Date.now();
    setSubTasks(nextSubTasks.map((subTask, index) => {
      const previous = subTask.id
        ? previousSubTasks.find((candidate) => candidate.id === subTask.id)
        : previousSubTasks[index];
      return {
        id: subTask.id || previous?.id || `${changedAt}-${index}`,
        title: subTask.title,
        completed: subTask.completed,
        createdAt: previous?.createdAt || changedAt,
        completedAt: subTask.completed ? previous?.completedAt : undefined,
      };
    }));

    const previousIds = new Set(previousSubTasks.map((subTask) => subTask.id));
    const nextIds = new Set(nextSubTasks.map((subTask) => subTask.id).filter(Boolean));

    nextSubTasks.filter((subTask) => !subTask.id).forEach((subTask) => onAddSubTask(subTask.title));
    previousSubTasks.filter((subTask) => !nextIds.has(subTask.id)).forEach((subTask) => onDeleteSubTask(subTask.id));
    nextSubTasks.forEach((subTask) => {
      if (!subTask.id || !previousIds.has(subTask.id)) return;
      const previous = previousSubTasks.find((candidate) => candidate.id === subTask.id);
      if (previous && previous.completed !== subTask.completed) onToggleSubTask(subTask.id);
    });
  };

  return (
    <div className="-mx-6 -my-8 min-h-[calc(100vh-4rem)] bg-card flex flex-col">
      <div className="border-b border-border px-4 py-3">
        <button type="button" onClick={onClose} className="flex items-center gap-2 text-foreground" aria-label="Back to tasks">
          <ArrowLeftLgIcon size={20} /> <span className="font-semibold">Edit Task</span>
        </button>
      </div>
      <TaskModalHeader isEditing isFullScreen={false} onFullScreenToggle={() => {}} showFullScreenToggle={false} showCloseButton={false} onClose={onClose} />
      <div className="flex-1 p-4 space-y-8 overflow-y-auto">
        <TaskFormContent title={title} priority={priority} startDate={startDate} dueDate={dueDate} startTime={startTime} endTime={endTime} estimatedDuration={estimatedDuration} isRecurring={isRecurring} recurrencePattern={recurrencePattern} recurrenceInterval={recurrenceInterval} recurrenceDaysOfWeek={recurrenceDaysOfWeek} recurrenceEndDate={recurrenceEndDate} onTitleChange={setTitle} onPriorityChange={setPriority} onStartDateChange={setStartDate} onDueDateChange={setDueDate} onStartTimeChange={handleStartTimeChange} onEndTimeChange={handleEndTimeChange} onDurationChange={setEstimatedDuration} onIsRecurringChange={setIsRecurring} onRecurrencePatternChange={setRecurrencePattern} onRecurrenceIntervalChange={setRecurrenceInterval} onRecurrenceDaysOfWeekChange={setRecurrenceDaysOfWeek} onRecurrenceEndDateChange={setRecurrenceEndDate} />
        <MobileTaskOptions selectedSubDomain={selectedSubDomain} onSubDomainChange={setSelectedSubDomain} subTasks={subTasks} onSubTasksChange={handleSubTasksChange} />
        <TaskMetaInfo createdAt={task.createdAt} completedAt={task.completedAt} pomodoroCount={task.pomodoroCount} />
      </div>
      <TaskViewFooter task={task} onClose={onClose} onSave={handleSave} onUpdate={onUpdate} />
    </div>
  );
}
