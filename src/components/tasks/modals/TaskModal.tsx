/**
 * @fileoverview TaskModal component for creating and editing tasks.
 * Provides a comprehensive form with fields for title, priority, tags, dates, times,
 * duration, notes, categories, and subtasks. Supports fullscreen mode.
 */

"use client";

import { useState } from "react";
import TaskModalHeader from "./TaskModalHeader";
import TaskModalTabs from "./TaskModalTabs";
import TaskModalDetails from "./TaskModalDetails";
import TaskModalFullscreen from "./TaskModalFullscreen";
import TaskModalFooter from "./TaskModalFooter";
import CategorySelector from "../../../components/tasks/forms/CategorySelector";
import SubTaskManager from "../../../components/tasks/items/SubTaskManager";
import { Priority, SubDomain, Tag } from "@/types";

/**
 * Props for the TaskModal component.
 */
interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: TaskFormData) => void;
  initialData?: TaskFormData;
  /** Available tags for task categorization */
  tags: Tag[];
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
 * Features include priority selection, tag assignment, date/time scheduling,
 * duration calculation, notes, category selection, and subtask management.
 * Supports both compact and fullscreen modes.
 */
export default function TaskModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  tags,
}: TaskModalProps) {
  if (!isOpen) return null;

  const resetKey = initialData ? JSON.stringify(initialData) : "new";

  return (
    <TaskModalContent
      key={resetKey}
      onClose={onClose}
      onSave={onSave}
      initialData={initialData}
      tags={tags}
    />
  );
}

function TaskModalContent({
  onClose,
  onSave,
  initialData,
  tags,
}: Omit<TaskModalProps, "isOpen">) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [title, setTitle] = useState(() => initialData?.title || "");
  const [priority, setPriority] = useState<Priority | undefined>(
    () => initialData?.priority,
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    () => initialData?.tags || [],
  );
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
  const [notes, setNotes] = useState(() => initialData?.notes || "");
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

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
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
          <TaskModalTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            selectedSubDomain={selectedSubDomain}
            subTasksCount={subTasks.length}
          />
        )}

        {/* Content */}
        <div
          className={`${isFullScreen ? "grid grid-cols-[1fr_1fr] gap-8" : ""}`}
        >
          {/* Main Content */}
          <div className={`${isFullScreen ? "p-6 space-y-8" : ""}`}>
            {/* Tab Panels for Compact Mode */}
            {!isFullScreen && (
              <div className="h-[calc(90vh-200px)] overflow-y-auto">
                {activeTab === "details" && (
                  <TaskModalDetails
                    title={title}
                    priority={priority}
                    tags={tags}
                    selectedTags={selectedTags}
                    startDate={startDate}
                    dueDate={dueDate}
                    startTime={startTime}
                    endTime={endTime}
                    estimatedDuration={estimatedDuration}
                    notes={notes}
                    onTitleChange={setTitle}
                    onPriorityChange={setPriority}
                    onTagsToggle={toggleTag}
                    onStartDateChange={setStartDate}
                    onDueDateChange={setDueDate}
                    onStartTimeChange={setStartTime}
                    onEndTimeChange={setEndTime}
                    onDurationChange={setEstimatedDuration}
                    onNotesChange={setNotes}
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
                <TaskModalFullscreen
                  title={title}
                  priority={priority}
                  tags={tags}
                  selectedTags={selectedTags}
                  startDate={startDate}
                  dueDate={dueDate}
                  startTime={startTime}
                  endTime={endTime}
                  estimatedDuration={estimatedDuration}
                  notes={notes}
                  selectedSubDomain={selectedSubDomain}
                  subTasks={subTasks}
                  searchQuery={searchQuery}
                  isCategoriesOpen={isCategoriesOpen}
                  isSubTasksOpen={isSubTasksOpen}
                  onTitleChange={setTitle}
                  onPriorityChange={setPriority}
                  onTagsToggle={toggleTag}
                  onStartDateChange={setStartDate}
                  onDueDateChange={setDueDate}
                  onStartTimeChange={setStartTime}
                  onEndTimeChange={setEndTime}
                  onDurationChange={setEstimatedDuration}
                  onNotesChange={setNotes}
                  onSubDomainChange={setSelectedSubDomain}
                  onSubTasksChange={setSubTasks}
                  onSearchChange={setSearchQuery}
                  onCategoriesToggle={() =>
                    setIsCategoriesOpen(!isCategoriesOpen)
                  }
                  onSubTasksToggle={() => setIsSubTasksOpen(!isSubTasksOpen)}
                />
              </div>
            )}
          </div>
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
