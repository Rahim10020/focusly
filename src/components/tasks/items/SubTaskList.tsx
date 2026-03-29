/**
 * @fileoverview SubTask list component for task details modal
 */

"use client";

import { useState } from "react";
import { SubTask } from "@/types";
import Button from "@/components/ui/Button";
import { CircleIcon, CloseLgIcon } from "@/components/shared/icons";

interface SubTaskListProps {
  subTasks: SubTask[];
  onToggleSubTask: (subTaskId: string) => void;
  onDeleteSubTask: (subTaskId: string) => void;
  onAddSubTask: (title: string) => void;
}

export function SubTaskList({
  subTasks,
  onToggleSubTask,
  onDeleteSubTask,
  onAddSubTask,
}: SubTaskListProps) {
  const [newSubTask, setNewSubTask] = useState("");

  const addSubTask = () => {
    if (newSubTask.trim()) {
      onAddSubTask(newSubTask.trim());
      setNewSubTask("");
    }
  };

  return (
    <div className="p-6 space-y-4 mb-18">
      {subTasks.length > 0 ? (
        <div className="space-y-2">
          {subTasks.map((subTask) => (
            <div
              key={subTask.id}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
            >
              <input
                type="checkbox"
                checked={subTask.completed}
                onChange={() => onToggleSubTask(subTask.id)}
                className="w-4 h-4 text-primary border-border cursor-pointer rounded focus:ring-primary"
              />
              <span
                className={`flex-1 text-sm ${subTask.completed ? "line-through text-muted-foreground" : "text-foreground"}`}
              >
                {subTask.title}
              </span>
              <button
                onClick={() => onDeleteSubTask(subTask.id)}
                className="text-muted-foreground hover:text-error transition-colors cursor-pointer"
              >
                <CloseLgIcon size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <CircleIcon size={48} className="mx-auto mb-4 opacity-50" />
          <p>No subtasks added yet</p>
          <p className="text-sm">Break down your task into smaller steps</p>
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Add a subtask..."
          value={newSubTask}
          onChange={(e) => setNewSubTask(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addSubTask()}
          className="flex-1 px-3 py-2 bg-muted text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Button onClick={addSubTask} disabled={!newSubTask.trim()} size="sm">
          Add
        </Button>
      </div>
    </div>
  );
}
