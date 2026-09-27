"use client";

import { useState, memo, type HTMLAttributes } from "react";
import { Task, Tag, DOMAINS, getDomainFromSubDomain } from "@/types";
import Button from "@/components/ui/Button";
import PriorityBadge from "@/components/shared/badges/PriorityBadge";
import TagBadge from "@/components/shared/badges/TagBadge";
import DueDateBadge from "@/components/shared/badges/DueDateBadge";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import TaskViewModal from "@/app/(app)/tasks/_components/modals/TaskViewModal";
import { useSound } from "@/hooks/useSound";
import { CheckIcon } from "@/components/shared/icons";
import { RecurrenceService } from "@/lib/domain/services/RecurrenceService";
import { DragHorizontalIcon, TrashEmptyIcon } from "@/components/shared/icons";
import EditPencilIcon from "@/components/shared/icons/EditPencilIcon";
import { TaskCheckbox } from "./TaskCheckbox";

/**
 * Props for the TaskItem component.
 */
interface TaskItemProps {
  task: Task;
  isActive: boolean;
  tags: Tag[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onAddSubTask: (taskId: string, title: string) => void;
  onToggleSubTask: (taskId: string, subTaskId: string) => void;
  onDeleteSubTask: (taskId: string, subTaskId: string) => void;
  isDragging?: boolean;
  dragHandleProps?: HTMLAttributes<HTMLDivElement>;
  isSelected?: boolean;
  onToggleSelection?: (taskId: string) => void;
}

/**
 * TaskItem component displays a single task card with all its details and actions.
 * Includes visual feedback for active state, drag state, and completion status.
 * Plays sound effect when task is completed.
 */
function TaskItem({
  task,
  isActive,
  tags,
  onToggle,
  onDelete,
  onSelect,
  onUpdate,
  onAddSubTask,
  onToggleSubTask,
  onDeleteSubTask,
  isDragging,
  dragHandleProps,
  isSelected,
  onToggleSelection,
}: TaskItemProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { playWorkComplete } = useSound();
  const taskTags = tags.filter((tag) => task.tags?.includes(tag.id));

  const completedSubTasks = (task.subTasks || []).filter(
    (st) => st.completed,
  ).length;
  const totalSubTasks = (task.subTasks || []).length;

  const handleToggle = () => {
    if (!task.completed) {
      playWorkComplete();
    }
    onToggle(task.id);
  };

  const titleClassName = `text-xl font-medium wrap-break-word ${
    task.completed ? "line-through text-muted-foreground" : "text-foreground"
  }`;

  const activeBadge = isActive && !task.completed && (
    <span className="inline-flex items-center gap-1 text-xs bg-primary text-foreground px-2.5 py-2 rounded-full font-semibold animate-pulse-soft">
      {/* A changer apres quand j'aurai une meilleure icone */}
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="5" />
      </svg>
      Active
    </span>
  );

  return (
    <>
      <div
        className={`flex flex-col lg:flex-row items-start gap-4 p-4 rounded-xl transition-all duration-300 group ${
          isActive
            ? "border-2 border-brand-primary shadow-md"
            : "bg-card hover:bg-accent/50 border border-border hover:border-primary/20 hover:shadow-sm"
        } ${isDragging ? "opacity-50 scale-95 rotate-1" : ""}`}
      >
        {/* Mobile top row: drag handle left, selection checkbox far right */}
        <div className="flex w-full items-center justify-between lg:hidden">
          <div
            {...dragHandleProps}
            className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-primary transition-all"
          >
            <DragHorizontalIcon size={32} />
          </div>
          {onToggleSelection && (
            <button
              onClick={() => onToggleSelection(task.id)}
              className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                isSelected
                  ? "bg-primary border-primary"
                  : "border-muted-foreground hover:border-primary"
              }`}
            >
              {isSelected && <CheckIcon size={12} className="text-white" />}
            </button>
          )}
        </div>

        {/* Mobile title row: checkbox + title with a wide gap */}
        <div className="flex w-full items-center gap-4 lg:hidden">
          <TaskCheckbox completed={task.completed} onToggle={handleToggle} />
          <div className="flex min-w-0 flex-1 items-center gap-2 flex-wrap">
            <p className={titleClassName}>{task.title}</p>
            {activeBadge}
          </div>
        </div>

        {/* Selection Checkbox (desktop) */}
        {onToggleSelection && (
          <button
            onClick={() => onToggleSelection(task.id)}
            className={`hidden shrink-0 w-5 h-5 rounded border-2 items-center justify-center transition-all lg:mt-1 lg:flex ${
              isSelected
                ? "bg-primary border-primary"
                : "border-muted-foreground hover:border-primary"
            }`}
          >
            {isSelected && <CheckIcon size={12} className="text-white" />}
          </button>
        )}

        {/* Drag Handle (desktop) */}
        <div
          {...dragHandleProps}
          className="hidden shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-primary transition-all lg:mt-1 lg:block"
        >
          <DragHorizontalIcon size={32} />
        </div>

        {/* Checkbox (desktop) */}
        <div className="hidden lg:block">
          <TaskCheckbox completed={task.completed} onToggle={handleToggle} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Title and Active badge (desktop — mobile uses its own title row above) */}
          <div className="hidden items-center gap-2 flex-wrap lg:flex">
            <p className={titleClassName}>{task.title}</p>
            {activeBadge}
          </div>

          {/* Priority, Tags, Due Date, Subdomain */}
          <div className="flex items-center gap-2 flex-wrap">
            {task.priority && <PriorityBadge priority={task.priority} />}
            {taskTags.map((tag) => (
              <TagBadge key={tag.id} tag={tag} />
            ))}
            {task.dueDate && (
              <DueDateBadge dueDate={task.dueDate} completed={task.completed} />
            )}
            {task.subDomain && (
              <span className="text-xs bg-accent text-accent-foreground px-2 py-2 rounded-full">
                {
                  DOMAINS[getDomainFromSubDomain(task.subDomain)].subDomains[
                    task.subDomain
                  ].name
                }
              </span>
            )}
            {task.isRecurring && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-2 rounded-full">
                {RecurrenceService.getRecurrenceLabel(task) || "Recurring"}
              </span>
            )}
          </div>

          {/* Sub-tasks progress */}
          {totalSubTasks > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {/* A changer apres quand j'aurai une meilleure icone */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 11 12 14 22 4"></polyline>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
              </svg>
              <span>
                {completedSubTasks} / {totalSubTasks} sub-tasks
              </span>
            </div>
          )}

          {/* Pomodoro Count */}
          {task.pomodoroCount > 0 && (
            <p className="text-xs text-muted-foreground">
              🍅 {task.pomodoroCount} pomodoro
              {task.pomodoroCount > 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* View Details */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(true)}
            className="md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-accent"
            title="View details"
          >
            <EditPencilIcon size={16} />
          </Button>

          {/* Delete */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-error/10 hover:text-error"
          >
            <TrashEmptyIcon size={16} />
          </Button>

          {/* Set Active / Unset */}
          {!task.completed && !isActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelect(task.id)}
              className="md:opacity-0 md:group-hover:opacity-100 transition-all"
            >
              Set Active
            </Button>
          )}

          {isActive && !task.completed && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onSelect(null)}
            >
              Unset
            </Button>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && (
        <TaskViewModal
          key={task.id}
          task={task}
          onClose={() => setShowDetails(false)}
          onUpdate={(updates) => onUpdate(task.id, updates)}
          onAddSubTask={(title) => onAddSubTask(task.id, title)}
          onToggleSubTask={(subTaskId) => onToggleSubTask(task.id, subTaskId)}
          onDeleteSubTask={(subTaskId) => onDeleteSubTask(task.id, subTaskId)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          onDelete(task.id);
          setShowDeleteConfirm(false);
        }}
        title="Delete Task"
        itemName={task.title}
        warningNote={
          task.pomodoroCount > 0
            ? `Note: This task has ${task.pomodoroCount} completed pomodoro${task.pomodoroCount > 1 ? "s" : ""}.`
            : undefined
        }
      />
    </>
  );
}

// Export memoized version to prevent unnecessary re-renders
export default memo(TaskItem);
