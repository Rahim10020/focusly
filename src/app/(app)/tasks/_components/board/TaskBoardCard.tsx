/**
 * @fileoverview TaskBoardCard component for Kanban board
 */

"use client";

import { type DragEvent } from "react";
import { Task, Tag } from "@/types";
import Button from "@/components/ui/Button";
import CheckIcon from "@/components/shared/icons/CheckIcon";
import { CalendarIcon } from "@/components/shared/icons";

interface TaskBoardCardProps {
  task: Task;
  taskTags: Tag[];
  isActive: boolean;
  onDragStart: (e: DragEvent<HTMLDivElement>, taskId: string) => void;
  onStatusChange: (
    taskId: string,
    status: "todo" | "in-progress" | "done",
  ) => void;
  onEdit: (task: Task) => void;
  onSelect: (taskId: string) => void;
  onUnselect: () => void;
  onDelete: (taskId: string) => void;
  isSelected?: boolean;
  onToggleSelection?: (taskId: string) => void;
}

export function TaskBoardCard({
  task,
  taskTags,
  isActive,
  onDragStart,
  onStatusChange,
  onEdit,
  onSelect,
  onUnselect,
  onDelete,
  isSelected,
  onToggleSelection,
}: TaskBoardCardProps) {
  const isDone = task.status === "done" || task.completed;
  const isOverdue = !isDone && Boolean(task.failedAt);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      className={`p-4 rounded-xl border-2 bg-card transition-all duration-300 cursor-grab active:cursor-grabbing hover:shadow-md group ${
        isActive
          ? "border-primary/40 shadow-md ring-2 ring-primary/20"
          : "border-border hover:border-primary/30"
      } ${isSelected ? "ring-2 ring-primary/40" : ""}`}
    >
      {/* Task Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Selection Checkbox */}
        {onToggleSelection && (
          <button
            onClick={() => onToggleSelection(task.id)}
            className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
              isSelected
                ? "bg-primary border-primary"
                : "border-muted-foreground hover:border-primary"
            }`}
          >
            {isSelected && (
              <CheckIcon size={12} className="text-white" />
            )}
          </button>
        )}

        <button
          onClick={() => {
            if (isDone) {
              onStatusChange(task.id, "todo");
            } else {
              onStatusChange(task.id, "done");
            }
          }}
          className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
            isDone
              ? "bg-success border-success"
              : "border-primary hover:bg-primary/10"
          }`}
        >
          {isDone && <CheckIcon size={12} className="text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}
          >
            {task.title}
          </p>
          {task.dueDate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <CalendarIcon size={12} />
              <span>
                {new Date(task.dueDate).toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
              {new Date(task.dueDate).toDateString() ===
                new Date().toDateString() && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
                  Today
                </span>
              )}
              {isOverdue && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-error/10 text-error text-[10px] font-medium">
                  Overdue
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Task Meta */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {task.priority && (
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                task.priority === "high"
                  ? "bg-error/10 text-error"
                  : task.priority === "medium"
                    ? "bg-warning/10 text-warning"
                    : "bg-info/10 text-info"
              }`}
            >
              {task.priority}
            </span>
          )}
          {taskTags.slice(0, 2).map((tag) => (
            <span
              key={tag.id}
              className="px-2 py-0.5 rounded text-xs"
              style={{ backgroundColor: tag.color + "20", color: tag.color }}
            >
              {tag.name}
            </span>
          ))}
          {taskTags.length > 2 && (
            <span className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
              +{taskTags.length - 2}
            </span>
          )}
        </div>

        {task.pomodoroCount > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>🍅</span>
            <span>{task.pomodoroCount}</span>
          </div>
        )}

        {isActive && (
          <div className="flex items-center gap-1 text-xs text-primary font-medium">
            {/* A changer apres quand j'aurai une meilleure icone */}
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="5" />
            </svg>
            <span>Active</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(task)}
          className="text-xs"
        >
          Edit
        </Button>
        {!isActive && !isDone && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelect(task.id)}
            className="text-xs"
          >
            Set Active
          </Button>
        )}
        {isActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onUnselect}
            className="text-xs"
          >
            Unset
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(task.id)}
          className="text-xs text-error hover:bg-error/10"
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
