/**
 * @fileoverview TaskModalFullscreen component for fullscreen mode content.
 */

import TaskTitleInput from "../forms/TaskTitleInput";
import PrioritySelector from "../forms/PrioritySelector";
import ScheduleDuration from "../forms/ScheduleDuration";
import CategorySelector from "../forms/CategorySelector";
import SubTaskManager from "../items/SubTaskManager";
import {
  SubDomain,
  Priority,
  DOMAINS,
  getDomainFromSubDomain,
} from "@/types";
import { CaretDownMdIcon } from "@/components/shared/icons";

interface TaskModalFullscreenProps {
  title: string;
  priority: Priority | undefined;
  startDate: string;
  dueDate: string;
  startTime: string;
  endTime: string;
  estimatedDuration: string;
  selectedSubDomain: SubDomain | undefined;
  subTasks: { title: string; completed: boolean }[];
  searchQuery: string;
  isCategoriesOpen: boolean;
  isSubTasksOpen: boolean;
  onTitleChange: (value: string) => void;
  onPriorityChange: (value: Priority | undefined) => void;
  onStartDateChange: (value: string) => void;
  onDueDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onDurationChange: (value: string) => void;
  onSubDomainChange: (value: SubDomain | undefined) => void;
  onSubTasksChange: (subTasks: { title: string; completed: boolean }[]) => void;
  onSearchChange: (value: string) => void;
  onCategoriesToggle: () => void;
  onSubTasksToggle: () => void;
}

export default function TaskModalFullscreen({
  title,
  priority,
  startDate,
  dueDate,
  startTime,
  endTime,
  estimatedDuration,
  selectedSubDomain,
  subTasks,
  searchQuery,
  isCategoriesOpen,
  isSubTasksOpen,
  onTitleChange,
  onPriorityChange,
  onStartDateChange,
  onDueDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onDurationChange,
  onSubDomainChange,
  onSubTasksChange,
  onSearchChange,
  onCategoriesToggle,
  onSubTasksToggle,
}: TaskModalFullscreenProps) {
  return (
    <>
      {/* Main Content */}
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

        <div className="border-t border-border" />
      </div>

      {/* Right Sidebar - Categories & Subtasks */}
      <div className="space-y-6 border-l border-border pl-8">
        {/* Categories Accordion */}
        <div className="space-y-4">
          <button
            onClick={onCategoriesToggle}
            className="w-full flex items-center justify-between p-2 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              {/* A changer apres quand j'aurai une meilleure icone */}
              <CaretDownMdIcon
                size={20}
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
                onChange={onSubDomainChange}
                searchQuery={searchQuery}
                onSearchChange={onSearchChange}
              />
            </div>
          )}
        </div>

        {/* Subtasks Accordion */}
        <div className="space-y-4">
          <button
            onClick={onSubTasksToggle}
            className="w-full flex items-center justify-between p-2 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <CaretDownMdIcon
                size={20}
                className={`text-muted-foreground transition-transform ${isSubTasksOpen ? "rotate-180" : ""}`}
              />
              <span className="text-lg font-medium text-foreground">
                Subtasks
              </span>
              {subTasks.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {subTasks.filter((t) => t.completed).length}/{subTasks.length}
                </span>
              )}
            </div>
          </button>

          {isSubTasksOpen && (
            <div className="space-y-4 animate-slide-down">
              <SubTaskManager
                subTasks={subTasks}
                onSubTasksChange={onSubTasksChange}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
