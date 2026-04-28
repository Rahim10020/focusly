/**
 * @fileoverview TaskModal component for creating and editing tasks.
 * Provides a comprehensive form with fields for title, priority, dates, times,
 * duration, categories, and subtasks. Supports fullscreen mode.
 */

"use client";

import { useState } from "react";
import TaskModalHeader from "./TaskModalHeader";
import TaskViewTabs from "./TaskViewTabs";
import TaskFormContent from "./TaskFormContent";
import TaskFormContentFullscreen from "./TaskFormContentFullscreen";
import TaskModalFooter from "./TaskModalFooter";
import CategorySelector from "../forms/CategorySelector";
import SubTaskManager from "../items/SubTaskManager";
import { CaretDownMdIcon } from "@/components/shared/icons";
import { Priority, SubDomain, DOMAINS, getDomainFromSubDomain } from "@/types";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isSubTasksOpen, setIsSubTasksOpen] = useState(false);

  // Tab state for compact mode
  const [activeTab, setActiveTab] = useState<
    "details" | "categories" | "subtasks"
  >("details");

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
    });

    onClose();
  };

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
          isEditing={!!initialData}
          isFullScreen={isFullScreen}
          onFullScreenToggle={() => setIsFullScreen(!isFullScreen)}
          onClose={onClose}
        />

        {/* Tab Navigation (Compact Mode Only) */}
        {!isFullScreen && (
          <TaskViewTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            selectedSubDomain={selectedSubDomain}
            subTasksCount={subTasks.length}
          />
        )}

        {/* Content */}
        <div
          className={`${isFullScreen ? "grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-8" : ""}`}
        >
          {/* Main Content */}
          <div className={`${isFullScreen ? "p-6 space-y-8" : ""}`}>
            {/* Tab Panels for Compact Mode */}
            {!isFullScreen && (
              <div className="h-[calc(90vh-200px)] overflow-y-auto">
                {activeTab === "details" && (
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
                    onStartTimeChange={setStartTime}
                    onEndTimeChange={setEndTime}
                    onDurationChange={setEstimatedDuration}
                  />
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
                  <div className="p-6 space-y-4 mb-18">
                    <SubTaskManager
                      subTasks={subTasks}
                      onSubTasksChange={setSubTasks}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Fullscreen Content */}
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
                  onTitleChange={setTitle}
                  onPriorityChange={setPriority}
                  onStartDateChange={setStartDate}
                  onDueDateChange={setDueDate}
                  onStartTimeChange={setStartTime}
                  onEndTimeChange={setEndTime}
                  onDurationChange={setEstimatedDuration}
                />
              </div>
            )}
          </div>

          {isFullScreen && (
            <div className="p-6 space-y-6 md:border-l md:border-border md:pl-8 w-full">
              <div className="space-y-4">
                <button
                  onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                  className="w-full flex items-center justify-between p-2 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <CaretDownMdIcon
                      size={32}
                      className={`text-muted-foreground transition-transform ${isCategoriesOpen ? "rotate-180" : ""}`}
                    />
                    <span className="text-lg font-medium text-foreground">
                      Categories
                    </span>
                    {selectedSubDomain && (
                      <span className="text-sm text-muted-foreground">
                        {
                          DOMAINS[getDomainFromSubDomain(selectedSubDomain)]
                            ?.subDomains[selectedSubDomain].name
                        }
                      </span>
                    )}
                  </div>
                </button>

                {isCategoriesOpen && (
                  <div className="space-y-4 animate-slide-down">
                    <CategorySelector
                      selectedSubDomain={selectedSubDomain}
                      onChange={setSelectedSubDomain}
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => setIsSubTasksOpen(!isSubTasksOpen)}
                  className="w-full flex items-center justify-between p-2 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <CaretDownMdIcon
                      size={32}
                      className={`text-muted-foreground transition-transform ${isSubTasksOpen ? "rotate-180" : ""}`}
                    />
                    <span className="text-lg font-medium text-foreground">
                      Subtasks
                    </span>
                    {subTasks.length > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {subTasks.filter((t) => t.completed).length}/
                        {subTasks.length}
                      </span>
                    )}
                  </div>
                </button>

                {isSubTasksOpen && (
                  <div className="space-y-4 animate-slide-down">
                    <SubTaskManager
                      subTasks={subTasks}
                      onSubTasksChange={setSubTasks}
                    />
                  </div>
                )}
              </div>
            </div>
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
