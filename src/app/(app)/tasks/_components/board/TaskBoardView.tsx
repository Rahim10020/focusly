/**
 * @fileoverview TaskBoardView component for displaying tasks in a Kanban-style board.
 * Organizes tasks into columns by status (To Do, In Progress, Done) with drag-and-drop support.
 */

"use client";

import { Task, Tag, TaskStatus } from "@/types";
import React from "react";
import { TaskBoardCard } from "./TaskBoardCard";
import { CircleIcon } from "@/components/shared/icons";
import Button from "@/components/ui/Button";

/** Available sort types for task ordering */
type SortType = "default" | "alphabetical" | "createdAt" | "priority";

/**
 * Props for the TaskBoardView component.
 */
interface TaskBoardViewProps {
  tasks: Task[];
  activeTaskId: string | null;
  tags: Tag[];
  sortType: SortType;
  sortTasks: (taskList: Task[]) => Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onSelectTask: (id: string | null) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  searchQuery?: string;
  selectedTaskIds?: Set<string>;
  onToggleSelection?: (taskId: string) => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onBulkComplete?: () => void;
  onBulkDelete?: () => void;
}

/**
 * TaskBoardView component displays tasks in a Kanban-style board with three columns.
 * Supports drag-and-drop to change task status between To Do, In Progress, and Done.
 * Shows task details including priority, tags, due date, and pomodoro count.
 */
export default function TaskBoardView({
  tasks,
  activeTaskId,
  tags,
  sortTasks,
  onDelete,
  onSelectTask,
  onStatusChange,
  onEditTask,
  searchQuery: _searchQuery,
  selectedTaskIds,
  onToggleSelection,
  onSelectAll: _onSelectAll,
  onClearSelection,
  onBulkComplete,
  onBulkDelete,
}: TaskBoardViewProps) {
  const columns: { id: TaskStatus; title: string; color: string }[] = [
    {
      id: "todo",
      title: "To Do",
      color: "bg-muted-foreground/10 border-muted-foreground/20",
    },
    {
      id: "in-progress",
      title: "In Progress",
      color: "bg-warning/10 border-warning/20",
    },
    { id: "done", title: "Done", color: "bg-success/10 border-success/20" },
  ];

  const getTasksByStatus = (status: TaskStatus) => {
    const filteredTasks = tasks.filter((task) => {
      const taskStatus = task.status || (task.completed ? "done" : "todo");
      return taskStatus === status;
    });
    return sortTasks(filteredTasks);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      onStatusChange(taskId, targetStatus);
    }
  };

  const getTaskTags = (task: Task) => {
    return tags.filter((tag) => task.tags?.includes(tag.id));
  };

  return (
    <div className="h-full">
      {/* Bulk Actions */}
      {selectedTaskIds && selectedTaskIds.size > 0 && (
        <div className="flex items-center justify-between bg-muted/50 p-3 rounded-xl mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {selectedTaskIds.size} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="text-xs"
            >
              Cancel
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkComplete}
              className="text-xs"
            >
              Complete selected
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkDelete}
              className="text-xs text-error hover:text-error"
            >
              Delete selected
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);

          return (
            <div
              key={column.id}
              className="flex flex-col min-h-[500px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div
                className={`flex items-center justify-between p-4 rounded-t-xl border-2 ${column.color}`}
              >
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">
                    {column.title}
                  </h3>
                  <span className="px-2 py-0.5 bg-background/50 rounded-full text-xs font-medium">
                    {columnTasks.length}
                  </span>
                </div>
              </div>

              {/* Column Body */}
              <div className="flex-1 bg-card border-2 border-t-0 border-border rounded-b-xl p-4 space-y-3 overflow-y-auto">
                {columnTasks.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center text-muted-foreground">
                      <CircleIcon size={48} className="opacity-30" />
                      <p className="text-sm">No tasks</p>
                    </div>
                  </div>
                ) : (
                  columnTasks.map((task) => {
                    const taskTags = getTaskTags(task);
                    const isActive = activeTaskId === task.id;

                     return (
                       <TaskBoardCard
                         key={task.id}
                         task={task}
                         taskTags={taskTags}
                         isActive={isActive}
                         onDragStart={handleDragStart}
                         onStatusChange={(taskId, status) =>
                           onStatusChange(taskId, status as TaskStatus)
                         }
                         onEdit={onEditTask}
                         onSelect={onSelectTask}
                         onUnselect={() => onSelectTask(null)}
                         onDelete={onDelete}
                         isSelected={selectedTaskIds?.has(task.id)}
                         onToggleSelection={onToggleSelection}
                       />
                     );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
