"use client";

import { useState } from "react";
import { Task } from "@/types";
import { useTasks } from "@/hooks/useTasks";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { FailTaskModal } from "./FailTaskModal";
import { DYNAMIC_ROUTES } from "@/constants";
import {
  ArrowUndoIcon,
  CalendarIcon,
  CheckIcon,
  CloseLgIcon,
  EditPencilIcon,
  RedoIcon,
  TrashEmptyIcon,
} from "@/components/shared/icons";

interface TaskHistoryListProps {
  tasks: Task[];
  type?: "completed" | "failed" | "all" | "in-progress" | "upcoming";
}

export function TaskHistoryList({
  tasks,
  type: _type = "all",
}: TaskHistoryListProps) {
  const { updateTask, deleteTask } = useTasks();
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showFailModal, setShowFailModal] = useState(false);

  const StatusBadge = ({ task }: { task: Task }) => {
    if (task.completed) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-success/10 text-success border border-success/20">
          <CheckIcon size={16} /> Completed
        </span>
      );
    }
    if (task.failedAt) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-error/10 text-error border border-error/20">
          <CloseLgIcon size={16} /> Failed
        </span>
      );
    }
    if (task.dueDate && task.dueDate < Date.now()) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-warning/10 text-warning border border-warning/20">
          ⏰ Overdue
        </span>
      );
    }
    return null;
  };

  const QuickActions = ({ task }: { task: Task }) => (
    <div className="flex gap-1 flex-wrap">
      {task.failedAt && (
        <>
          <button
            className="px-2 py-1 cursor-pointer flex items-center gap-2 text-xs bg-info/10 text-info rounded hover:bg-info/20"
            onClick={() =>
              updateTask(task.id, {
                failedAt: undefined,
                completed: false,
              })
            }
          >
            <ArrowUndoIcon size={16} />
            Reactivate
          </button>

          <button
            className="px-2 py-1 cursor-pointer flex items-center gap-2 text-xs bg-purple/10 text-purple rounded hover:bg-purple/20"
            onClick={() => {
              setSelectedTask(task);
              setShowFailModal(true);
            }}
          >
            <CalendarIcon size={16} />
            Postpone
          </button>
        </>
      )}

      <button
        className="px-2 py-1 cursor-pointer flex items-center gap-2 text-xs bg-surface-muted text-foreground rounded hover:bg-surface-hover"
        onClick={() => router.push(DYNAMIC_ROUTES.TASKS_EDIT(task.id))}
      >
        <EditPencilIcon size={16} />
        Edit
      </button>

      {task.completed && (
        <button
          className="px-2 py-1 cursor-pointer flex items-center gap-2 text-xs bg-warning/10 text-warning rounded hover:bg-warning/20"
          onClick={() =>
            updateTask(task.id, {
              completed: false,
              completedAt: undefined,
            })
          }
        >
          <RedoIcon size={16} />
          Reopen
        </button>
      )}

      <button
        className="px-2 py-1 cursor-pointer flex items-center gap-2 text-xs bg-error/10 text-error rounded hover:bg-error/20"
        onClick={() => {
          if (confirm("Delete this task permanently?")) {
            setDeletingId(task.id);
            deleteTask(task.id).finally(() => setDeletingId(null));
          }
        }}
        disabled={deletingId === task.id}
      >
        <TrashEmptyIcon size={16} />
        Delete
      </button>
    </div>
  );

  return (
    <>
      <div className="space-y-4" data-type={_type}>
        {tasks.map((task) => (
          <div
            key={task.id}
            className="border border-border rounded-lg p-4 bg-card"
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-semibold mb-2">{task.title}</h4>
                <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
                  <StatusBadge task={task} />
                  <span>
                    {format(
                      new Date(
                        task.completedAt || task.failedAt || task.createdAt,
                      ),
                      "PPP",
                      { locale: enUS },
                    )}
                  </span>
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex gap-1">
                      {task.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full text-xs bg-surface-muted"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {task.pomodoroCount > 0 && (
                    <span className="text-xs">
                      🍅 {task.pomodoroCount} pomodoro
                      {task.pomodoroCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                {task.notes && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {task.notes}
                  </p>
                )}
              </div>
              <QuickActions task={task} />
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No tasks in history
          </p>
        )}
      </div>

      {selectedTask && (
        <FailTaskModal
          task={selectedTask}
          isOpen={showFailModal}
          onClose={() => {
            setShowFailModal(false);
            setSelectedTask(null);
          }}
          onConfirm={(updates) => updateTask(selectedTask.id, updates)}
        />
      )}
    </>
  );
}
