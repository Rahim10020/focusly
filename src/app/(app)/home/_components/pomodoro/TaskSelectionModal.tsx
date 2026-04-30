"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/shared/Modal";
import Button from "@/components/ui/Button";
import { SearchMagnifyingGlassIcon } from "@/components/shared/icons";
import { ROUTES } from "@/constants/routes";
import type { Task } from "@/types";

interface TaskSelectionModalProps {
  isOpen: boolean;
  tasks: Task[];
  activeTaskId: string | null;
  onClose: () => void;
  onSelectTask: (taskId: string) => void;
}

export default function TaskSelectionModal({
  isOpen,
  tasks,
  activeTaskId,
  onClose,
  onSelectTask,
}: TaskSelectionModalProps) {
  const router = useRouter();

  const activeTasks = useMemo(
    () => tasks.filter((task) => !task.completed),
    [tasks],
  );
  const hasValidInitialSelection = activeTaskId
    ? activeTasks.some((task) => task.id === activeTaskId)
    : false;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    hasValidInitialSelection ? activeTaskId : null,
  );

  const filteredTasks = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return activeTasks;
    }

    return activeTasks.filter((task) => {
      const titleMatch = task.title.toLowerCase().includes(normalizedQuery);
      const tagMatch = (task.tags ?? []).some((tag) =>
        tag.toLowerCase().includes(normalizedQuery),
      );

      return titleMatch || tagMatch;
    });
  }, [activeTasks, searchQuery]);

  const selectedTask = useMemo(
    () => activeTasks.find((task) => task.id === selectedTaskId) ?? null,
    [activeTasks, selectedTaskId],
  );
  const hasValidSelectedTask = useMemo(
    () => activeTasks.some((task) => task.id === selectedTaskId),
    [activeTasks, selectedTaskId],
  );

  const hasAnyActiveTask = activeTasks.length > 0;

  const footer = hasAnyActiveTask ? (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <Button variant="ghost" onClick={onClose}>
        Cancel
      </Button>
      <Button
        onClick={() => {
          if (!hasValidSelectedTask || !selectedTaskId) {
            return;
          }
          onSelectTask(selectedTaskId);
        }}
        disabled={!hasValidSelectedTask}
      >
        Start focus session
      </Button>
    </div>
  ) : (
    <div className="flex justify-end">
      <Button
        onClick={() => {
          onClose();
          router.push(ROUTES.CREATE_TASK);
        }}
      >
        Create a task
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select task"
      description="Choose a task before starting your pomodoro."
      size="md"
      footer={footer}
    >
      {!hasAnyActiveTask ? (
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-sm text-foreground font-medium">
            No active task found
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a task first, then start your focus session.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <SearchMagnifyingGlassIcon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search task"
              className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm text-foreground outline-none transition-all focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {filteredTasks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No task matches your search.
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const isSelected = task.id === selectedTaskId;

                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => setSelectedTaskId(task.id)}
                      className={`w-full cursor-pointer rounded-xl border p-3 text-left transition-all ${
                        isSelected
                          ? "border-primary/50 bg-primary/10"
                          : "border-border bg-card hover:bg-accent/60"
                      }`}
                    >
                      <p className="text-sm font-medium text-foreground line-clamp-2">
                        {task.title}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        {task.priority && (
                          <span className="rounded-full bg-muted px-2 py-0.5 uppercase">
                            {task.priority}
                          </span>
                        )}
                        {task.pomodoroCount > 0 && (
                          <span>{task.pomodoroCount} pomodoros</span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-4">
              {selectedTask ? (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Selected task
                  </p>
                  <p className="text-sm font-semibold text-foreground wrap-break-word">
                    {selectedTask.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedTask.pomodoroCount > 0
                      ? `${selectedTask.pomodoroCount} pomodoro completed`
                      : "No pomodoro completed yet"}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select a task from the list to start.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
