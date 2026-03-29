/**
 * @fileoverview TaskBoardView component for displaying tasks in a Kanban-style board.
 * Organizes tasks into columns by status (To Do, In Progress, Done) with drag-and-drop support.
 */

"use client";

import { Task, Tag, TaskStatus } from "@/types";
import React from "react";
import { TaskBoardCard } from "./TaskBoardCard";
import { CircleIcon } from "../../shared/icons";

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
  /** Callback when task edit is requested */
  onEditTask: (task: Task) => void;
}

/**
 * TaskBoardView component displays tasks in a Kanban-style board with three columns.
 * Supports drag-and-drop to change task status between To Do, In Progress, and Done.
 * Shows task details including priority, tags, due date, and pomodoro count.
 *
 * @param {TaskBoardViewProps} props - Component props
 * @param {Task[]} props.tasks - Array of all tasks to display
 * @param {string | null} props.activeTaskId - ID of the currently active task
 * @param {Tag[]} props.tags - Available tags for display
 * @param {SortType} props.sortType - Current sort method for tasks
 * @param {function} props.sortTasks - Function to sort task arrays
 * @param {function} props.onToggle - Callback when task completion is toggled
 * @param {function} props.onDelete - Callback when task is deleted
 * @param {function} props.onSelectTask - Callback when task is selected as active
 * @param {function} props.onUpdate - Callback when task is updated
 * @param {function} props.onStatusChange - Callback when task status changes via drag-and-drop
 * @param {function} props.onEditTask - Callback when task edit is requested
 *
 * @example
 * <TaskBoardView
 *   tasks={tasks}
 *   activeTaskId={currentTaskId}
 *   tags={availableTags}
 *   sortType="default"
 *   sortTasks={sortFunction}
 *   onToggle={handleToggle}
 *   onDelete={handleDelete}
 *   onSelectTask={handleSelect}
 *   onUpdate={handleUpdate}
 *   onStatusChange={handleStatusChange}
 *   onEditTask={handleEditTask}
 * />
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
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <CircleIcon size={48} className="opacity-30" />
                    <p className="text-sm">No tasks</p>
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
