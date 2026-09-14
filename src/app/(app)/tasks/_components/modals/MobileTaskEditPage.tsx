"use client";

import { useState } from "react";
import { ArrowLeftLgIcon, CaretDownMdIcon } from "@/components/shared/icons";
import { DOMAINS, getDomainFromSubDomain, Priority, SubDomain, Task } from "@/types";
import { DateTimeService } from "@/lib/domain/services/DateTimeService";
import TaskModalHeader from "./TaskModalHeader";
import TaskFormContent from "./TaskFormContent";
import TaskViewFooter from "./details/TaskViewFooter";
import CategorySelector from "../forms/CategorySelector";
import { TaskMetaInfo } from "../items/TaskMetaInfo";
import SubTaskManager from "../items/SubTaskManager";

interface MobileTaskEditPageProps {
  task: Task;
  onClose: () => void;
  onUpdate: (updates: Partial<Task>) => void;
  onAddSubTask: (title: string) => void;
  onToggleSubTask: (subTaskId: string) => void;
  onDeleteSubTask: (subTaskId: string) => void;
}

export default function MobileTaskEditPage({ task, onClose, onUpdate }: MobileTaskEditPageProps) {
  const [title, setTitle] = useState(task.title || "");
  const [priority, setPriority] = useState<Priority | undefined>(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
  const [startDate, setStartDate] = useState(task.startDate ? new Date(task.startDate).toISOString().split("T")[0] : "");
  const [startTime, setStartTime] = useState(task.startTime || "");
  const [endTime, setEndTime] = useState(task.endTime || "");
  const [estimatedDuration, setEstimatedDuration] = useState(task.estimatedDuration?.toString() || "");
  const [selectedSubDomain, setSelectedSubDomain] = useState<SubDomain | undefined>(task.subDomain);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isSubTasksOpen, setIsSubTasksOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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

  return (
    <div className="-mx-6 -my-8 min-h-[calc(100vh-4rem)] bg-card flex flex-col">
      <div className="border-b border-border px-4 py-3">
        <button type="button" onClick={onClose} className="flex items-center gap-2 text-foreground" aria-label="Back to tasks">
          <ArrowLeftLgIcon size={20} /> <span className="font-semibold">Edit Task</span>
        </button>
      </div>
      <TaskModalHeader isEditing isFullScreen={false} onFullScreenToggle={() => {}} showFullScreenToggle={false} onClose={onClose} />
      <div className="flex-1 p-4 space-y-8 overflow-y-auto">
        <TaskFormContent title={title} priority={priority} startDate={startDate} dueDate={dueDate} startTime={startTime} endTime={endTime} estimatedDuration={estimatedDuration} isRecurring={isRecurring} recurrencePattern={recurrencePattern} recurrenceInterval={recurrenceInterval} recurrenceDaysOfWeek={recurrenceDaysOfWeek} recurrenceEndDate={recurrenceEndDate} onTitleChange={setTitle} onPriorityChange={setPriority} onStartDateChange={setStartDate} onDueDateChange={setDueDate} onStartTimeChange={handleStartTimeChange} onEndTimeChange={handleEndTimeChange} onDurationChange={setEstimatedDuration} onIsRecurringChange={setIsRecurring} onRecurrencePatternChange={setRecurrencePattern} onRecurrenceIntervalChange={setRecurrenceInterval} onRecurrenceDaysOfWeekChange={setRecurrenceDaysOfWeek} onRecurrenceEndDateChange={setRecurrenceEndDate} />
        <TaskMetaInfo createdAt={task.createdAt} completedAt={task.completedAt} pomodoroCount={task.pomodoroCount} />
        <section className="space-y-4">
          <button type="button" onClick={() => setIsCategoriesOpen(!isCategoriesOpen)} className="w-full flex items-center gap-3 p-2 text-left">
            <CaretDownMdIcon size={32} className={`text-muted-foreground transition-transform ${isCategoriesOpen ? "rotate-180" : ""}`} />
            <span className="text-lg font-medium">Categories</span>
            {selectedSubDomain && <span className="text-sm text-muted-foreground">{DOMAINS[getDomainFromSubDomain(selectedSubDomain)]?.subDomains[selectedSubDomain].name}</span>}
          </button>
          {isCategoriesOpen && <CategorySelector selectedSubDomain={selectedSubDomain} onChange={setSelectedSubDomain} searchQuery={searchQuery} onSearchChange={setSearchQuery} />}
        </section>
        <section className="space-y-4">
          <button type="button" onClick={() => setIsSubTasksOpen(!isSubTasksOpen)} className="w-full flex items-center gap-3 p-2 text-left">
            <CaretDownMdIcon size={32} className={`text-muted-foreground transition-transform ${isSubTasksOpen ? "rotate-180" : ""}`} />
            <span className="text-lg font-medium">Subtasks</span>
          </button>
          {isSubTasksOpen && <SubTaskManager subTasks={task.subTasks || []} onSubTasksChange={() => {}} />}
        </section>
      </div>
      <TaskViewFooter task={task} onClose={onClose} onSave={handleSave} onUpdate={onUpdate} />
    </div>
  );
}
