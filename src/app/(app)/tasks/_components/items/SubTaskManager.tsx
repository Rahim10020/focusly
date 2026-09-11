/**
 * @fileoverview SubTaskManager component for managing task subtasks.
 */

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { CircleIcon, CloseLgIcon } from "@/components/shared/icons";

interface SubTask {
  title: string;
  completed: boolean;
}

interface SubTaskManagerProps {
  subTasks: SubTask[];
  onSubTasksChange: (subTasks: SubTask[]) => void;
  compact?: boolean;
}

export default function SubTaskManager({
  subTasks,
  onSubTasksChange,
  compact = false,
}: SubTaskManagerProps) {
  const [newSubTask, setNewSubTask] = useState("");

  const addSubTask = () => {
    if (newSubTask.trim()) {
      onSubTasksChange([
        ...subTasks,
        { title: newSubTask.trim(), completed: false },
      ]);
      setNewSubTask("");
    }
  };

  const toggleSubTask = (index: number) => {
    onSubTasksChange(
      subTasks.map((task, i) =>
        i === index ? { ...task, completed: !task.completed } : task,
      ),
    );
  };

  const removeSubTask = (index: number) => {
    onSubTasksChange(subTasks.filter((_, i) => i !== index));
  };

  return (
    <div className={`${compact ? "space-y-2" : "space-y-4"}`}>
      <div className={`flex items-center gap-2 ${compact ? "" : ""}`}>
        <Input
          type="text"
          placeholder="Add a subtask..."
          value={newSubTask}
          onChange={(e) => setNewSubTask(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addSubTask()}
          className={compact ? "h-8 text-xs" : ""}
        />
        <Button onClick={addSubTask} disabled={!newSubTask.trim()} size="sm">
          Add
        </Button>
      </div>

      {subTasks.length > 0 ? (
        <div className={`${compact ? "max-h-[40vh] overflow-y-auto space-y-1" : "space-y-2"}`}>
          {subTasks.map((subTask, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 ${compact ? "p-2" : "p-3 bg-muted/50 rounded-lg"}`}
            >
              <input
                type="checkbox"
                checked={subTask.completed}
                onChange={() => toggleSubTask(index)}
                className={`cursor-pointer rounded focus:ring-primary ${compact ? "w-3 h-3" : "w-4 h-4 text-primary border-border"}`}
              />
              <span
                className={`flex-1 ${compact ? "text-xs" : "text-sm"} ${subTask.completed ? "line-through text-muted-foreground" : "text-foreground"}`}
              >
                {subTask.title}
              </span>
              <button
                onClick={() => removeSubTask(index)}
                className="text-muted-foreground hover:text-error transition-colors cursor-pointer"
              >
                <CloseLgIcon size={compact ? 12 : 16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className={`${compact ? "py-4" : "text-center py-8 text-muted-foreground"}`}>
          {!compact && (
            <>
              <CircleIcon size={48} className="mx-auto mb-4 opacity-50" />
              <p>No subtasks added yet</p>
              <p className="text-sm">Break down your task into smaller steps</p>
            </>
          )}
          {compact && (
            <p className="text-xs text-muted-foreground text-center">No subtasks yet</p>
          )}
        </div>
      )}
    </div>
  );
}
