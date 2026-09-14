"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftLgIcon } from "@/components/shared/icons";
import { Priority, SubDomain } from "@/types";
import TaskFormContent from "@/app/(app)/tasks/_components/modals/TaskFormContent";
import TaskModalHeader from "@/app/(app)/tasks/_components/modals/TaskModalHeader";
import TaskModalFooter from "@/app/(app)/tasks/_components/modals/TaskModalFooter";
import { TaskFormData } from "@/app/(app)/tasks/_components/modals/TaskEditModal";

interface MobileTaskFormPageProps {
  onClose: () => void;
  onSave: (taskData: TaskFormData) => void;
}

export default function MobileTaskFormPage({ onClose, onSave }: MobileTaskFormPageProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>();
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [selectedSubDomain, setSelectedSubDomain] = useState<SubDomain>();
  const [subTasks, setSubTasks] = useState<{ title: string; completed: boolean }[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<"daily" | "weekly" | "monthly" | "custom">("daily");
  const [recurrenceInterval, setRecurrenceInterval] = useState("1");
  const [recurrenceDaysOfWeek, setRecurrenceDaysOfWeek] = useState<number[]>([1, 3, 5]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(), priority, dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
      startDate: startDate ? new Date(startDate).getTime() : undefined,
      startTime: startTime || undefined, endTime: endTime || undefined,
      estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : undefined,
      subDomain: selectedSubDomain, subTasks: subTasks.length ? subTasks : undefined,
      isRecurring: isRecurring || undefined,
      recurrencePattern: isRecurring ? recurrencePattern : undefined,
      recurrenceInterval: isRecurring ? parseInt(recurrenceInterval) || 1 : undefined,
      recurrenceDaysOfWeek: isRecurring && recurrencePattern === "custom" ? recurrenceDaysOfWeek : undefined,
      recurrenceEndDate: isRecurring && recurrenceEndDate ? recurrenceEndDate : undefined,
    });
  };

  return (
    <div className="-mx-6 -my-8 min-h-[calc(100vh-4rem)] bg-card flex flex-col">
      <div className="border-b border-border px-4 py-3">
        <button type="button" onClick={() => router.back()} className="flex items-center gap-2 text-foreground" aria-label="Back to tasks">
          <ArrowLeftLgIcon size={20} /> <span className="font-semibold">New Task</span>
        </button>
      </div>
      <TaskModalHeader isEditing={false} isFullScreen={false} onFullScreenToggle={() => {}} showFullScreenToggle={false} onClose={onClose} selectedSubDomain={selectedSubDomain} onSubDomainChange={setSelectedSubDomain} subTasks={subTasks} onSubTasksChange={setSubTasks} />
      <div className="flex-1 p-4 overflow-y-auto">
        <TaskFormContent title={title} priority={priority} startDate={startDate} dueDate={dueDate} startTime={startTime} endTime={endTime} estimatedDuration={estimatedDuration} isRecurring={isRecurring} recurrencePattern={recurrencePattern} recurrenceInterval={recurrenceInterval} recurrenceDaysOfWeek={recurrenceDaysOfWeek} recurrenceEndDate={recurrenceEndDate} onTitleChange={setTitle} onPriorityChange={setPriority} onStartDateChange={setStartDate} onDueDateChange={setDueDate} onStartTimeChange={setStartTime} onEndTimeChange={setEndTime} onDurationChange={setEstimatedDuration} onIsRecurringChange={setIsRecurring} onRecurrencePatternChange={setRecurrencePattern} onRecurrenceIntervalChange={setRecurrenceInterval} onRecurrenceDaysOfWeekChange={setRecurrenceDaysOfWeek} onRecurrenceEndDateChange={setRecurrenceEndDate} />
      </div>
      <TaskModalFooter isEditing={false} isValid={!!title.trim()} onClose={onClose} onSubmit={handleSubmit} />
    </div>
  );
}
