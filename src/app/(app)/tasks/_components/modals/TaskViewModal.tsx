/**
 * @fileoverview TaskDetailsModal component for viewing and editing task details.
 */

"use client";

import { useState } from "react";
import { Task, Priority, SubDomain } from "@/types";
import TaskModalHeader from "./TaskModalHeader";
import TaskViewTabs from "./TaskViewTabs";
import TaskFormContent from "./TaskFormContent";
import TaskFormContentFullscreen from "./TaskFormContentFullscreen";
import CategorySelector from "../forms/CategorySelector";
import { TaskMetaInfo } from "../items/TaskMetaInfo";
import { SubTaskList } from "../items/SubTaskList";
import { DateTimeService } from "@/lib/domain/services/DateTimeService";
import TaskViewFooter from "./details/TaskViewFooter";

interface TaskDetailsModalProps {
  task: Task;
  onClose: () => void;
  onUpdate: (updates: Partial<Task>) => void;
  onAddSubTask: (title: string) => void;
  onToggleSubTask: (subTaskId: string) => void;
  onDeleteSubTask: (subTaskId: string) => void;
}

export default function TaskDetailsModal({
  task,
  onClose,
  onUpdate,
  onAddSubTask,
  onToggleSubTask,
  onDeleteSubTask,
}: TaskDetailsModalProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [title, setTitle] = useState(task.title || "");
  const [notes] = useState(task.notes || "");
  const [priority, setPriority] = useState<Priority | undefined>(task.priority);
  const [selectedTags] = useState<string[]>(task.tags || []);
  const [dueDate, setDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
  );
  const [startDate, setStartDate] = useState(
    task.startDate ? new Date(task.startDate).toISOString().split("T")[0] : "",
  );
  const [startTime, setStartTime] = useState(task.startTime || "");
  const [endTime, setEndTime] = useState(task.endTime || "");
  const [estimatedDuration, setEstimatedDuration] = useState(
    task.estimatedDuration?.toString() || "",
  );
  const [selectedSubDomain, setSelectedSubDomain] = useState<
    SubDomain | undefined
  >(task.subDomain);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isSubTasksOpen, setIsSubTasksOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<
    "details" | "categories" | "subtasks"
  >("details");

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

  const handleSave = () => {
    onUpdate({
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
    });
  };

  if (!task) return null;

  const modalClasses = isFullScreen
    ? "fixed inset-0 z-50 bg-background"
    : "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm";
  const contentClasses = isFullScreen
    ? "w-full h-full bg-card border-0 rounded-none shadow-none overflow-y-auto"
    : "w-full max-w-2xl max-h-[90vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden";

  return (
    <div className={modalClasses}>
      <div className={contentClasses}>
        <TaskModalHeader
          isEditing={true}
          isFullScreen={isFullScreen}
          onFullScreenToggle={() => setIsFullScreen(!isFullScreen)}
          onClose={onClose}
        />

        {!isFullScreen && (
          <TaskViewTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            selectedSubDomain={selectedSubDomain}
            subTasksCount={task.subTasks?.length || 0}
          />
        )}

        <div
          className={`${isFullScreen ? "grid grid-cols-[3fr_2fr] gap-8" : ""}`}
        >
          <div className={`${isFullScreen ? "p-6 space-y-8" : ""}`}>
            {!isFullScreen && (
              <div className="h-[calc(90vh-200px)] overflow-y-auto">
                {activeTab === "details" && (
                  <div className="p-6 space-y-8">
                    <TaskFormContent
                      title={title}
                      priority={priority}
                      startDate={startDate}
                      dueDate={dueDate}
                      startTime={startTime}
                      endTime={endTime}
                      estimatedDuration={estimatedDuration}
                      onTitleChange={setTitle}
                      onPriorityChange={setPriority}
                      onStartDateChange={setStartDate}
                      onDueDateChange={setDueDate}
                      onStartTimeChange={handleStartTimeChange}
                      onEndTimeChange={handleEndTimeChange}
                      onDurationChange={setEstimatedDuration}
                    />
                    <TaskMetaInfo
                      createdAt={task.createdAt}
                      completedAt={task.completedAt}
                      pomodoroCount={task.pomodoroCount}
                    />
                  </div>
                )}
                {activeTab === "categories" && (
                  <div className="p-6 space-y-4">
                    <CategorySelector
                      selectedSubDomain={selectedSubDomain}
                      onChange={setSelectedSubDomain}
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                    />
                  </div>
                )}
                {activeTab === "subtasks" && (
                  <SubTaskList
                    subTasks={task.subTasks || []}
                    onToggleSubTask={onToggleSubTask}
                    onDeleteSubTask={onDeleteSubTask}
                    onAddSubTask={onAddSubTask}
                  />
                )}
              </div>
            )}
            {isFullScreen && (
              <div className="p-6 space-y-8">
                <TaskFormContentFullscreen
                  title={title}
                  priority={priority}
                  startDate={startDate}
                  dueDate={dueDate}
                  startTime={startTime}
                  endTime={endTime}
                  estimatedDuration={estimatedDuration}
                  selectedSubDomain={selectedSubDomain}
                  subTasks={task.subTasks || []}
                  searchQuery={searchQuery}
                  isCategoriesOpen={isCategoriesOpen}
                  isSubTasksOpen={isSubTasksOpen}
                  onTitleChange={setTitle}
                  onPriorityChange={setPriority}
                  onStartDateChange={setStartDate}
                  onDueDateChange={setDueDate}
                  onStartTimeChange={handleStartTimeChange}
                  onEndTimeChange={handleEndTimeChange}
                  onDurationChange={setEstimatedDuration}
                  onSubDomainChange={setSelectedSubDomain}
                  onSubTasksChange={() => {}}
                  onSearchChange={setSearchQuery}
                  onCategoriesToggle={() =>
                    setIsCategoriesOpen(!isCategoriesOpen)
                  }
                  onSubTasksToggle={() => setIsSubTasksOpen(!isSubTasksOpen)}
                />
                <TaskMetaInfo
                  createdAt={task.createdAt}
                  completedAt={task.completedAt}
                  pomodoroCount={task.pomodoroCount}
                />
              </div>
            )}
          </div>
        </div>

        <TaskViewFooter
          task={task}
          onClose={onClose}
          onSave={handleSave}
          onUpdate={onUpdate}
        />
      </div>
    </div>
  );
}
