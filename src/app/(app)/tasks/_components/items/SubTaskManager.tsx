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
}

export default function SubTaskManager({
  subTasks,
  onSubTasksChange,
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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="Add a subtask..."
          value={newSubTask}
          onChange={(e) => setNewSubTask(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addSubTask()}
        />
        <Button onClick={addSubTask} disabled={!newSubTask.trim()} size="sm">
          Add
        </Button>
      </div>

      {subTasks.length > 0 ? (
        <div className="space-y-2">
          {subTasks.map((subTask, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
            >
              <input
                type="checkbox"
                checked={subTask.completed}
                onChange={() => toggleSubTask(index)}
                className="w-4 h-4 text-primary border-border cursor-pointer rounded focus:ring-primary"
              />
              <span
                className={`flex-1 text-sm ${subTask.completed ? "line-through text-muted-foreground" : "text-foreground"}`}
              >
                {subTask.title}
              </span>
              <button
                onClick={() => removeSubTask(index)}
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
    </div>
  );
}
