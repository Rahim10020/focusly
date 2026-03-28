/**
 * @fileoverview Task CRUD operations hook.
 * Provides add, update, delete, toggle operations for tasks.
 */

import { useCallback } from "react";
import { useSession } from "next-auth/react";
import { Task } from "@/types";
import { CreateTaskInput } from "@/types/task-input";
import { supabaseClient } from "@/lib/supabase/client";
import { retryWithBackoff } from "@/lib/utils/retry";
import { useToastContext } from "@/components/providers/ToastProvider";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/database.types";

const typedSupabaseClient: SupabaseClient<Database> = supabaseClient;

interface UseTaskActionsReturn {
  addTask: (input: CreateTaskInput) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  incrementPomodoro: (id: string) => Promise<void>;
}

interface UseTaskActionsProps {
  tasks: Task[];
  setTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void;
}

export function useTaskActions({
  tasks,
  setTasks,
}: UseTaskActionsProps): UseTaskActionsReturn {
  const { data: session } = useSession();
  const { error: showErrorToast } = useToastContext();

  const getUserId = useCallback(() => session?.user?.id, [session]);

  const addTask = useCallback(
    async (input: CreateTaskInput) => {
      const maxOrder =
        tasks.length > 0 ? Math.max(...tasks.map((t) => t.order || 0)) : 0;
      const newTask: Task = {
        id: Date.now().toString(),
        title: input.title,
        completed: false,
        createdAt: Date.now(),
        pomodoroCount: 0,
        priority: input.priority,
        tags: input.tags || [],
        dueDate: input.dueDate,
        startDate: input.scheduling?.startDate,
        startTime: input.scheduling?.startTime,
        endTime: input.scheduling?.endTime,
        estimatedDuration: input.scheduling?.estimatedDuration,
        notes: input.notes,
        subTasks: [],
        order: maxOrder + 1,
        subDomain: input.subDomain,
      };

      const userId = getUserId();
      if (userId) {
        try {
          const insertData = {
            user_id: userId,
            title: newTask.title,
            completed: newTask.completed,
            created_at: new Date(newTask.createdAt).toISOString(),
            pomodoro_count: newTask.pomodoroCount,
            priority: newTask.priority,
            tags: newTask.tags,
            due_date: newTask.dueDate
              ? new Date(newTask.dueDate).toISOString()
              : null,
            start_date: newTask.startDate
              ? new Date(newTask.startDate).toISOString()
              : null,
            start_time: newTask.startTime,
            end_time: newTask.endTime,
            estimated_duration: newTask.estimatedDuration,
            notes: newTask.notes,
            order: newTask.order,
            sub_domain: newTask.subDomain,
          };

          const { data, error } = await retryWithBackoff(async () => {
            const result = await typedSupabaseClient
              .from("tasks")
              .insert(insertData)
              .select()
              .single();
            if (result.error) throw result.error;
            return result;
          });

          if (error) throw error;

          const createdTask = data as
            | Database["public"]["Tables"]["tasks"]["Row"]
            | null;
          if (!createdTask)
            throw new Error("No data returned when creating task");
          newTask.id = createdTask.id;
          setTasks([...tasks, newTask]);
        } catch (error: unknown) {
          console.error("Error adding task to DB:", error);
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to save task to database";
          showErrorToast("Failed to Add Task", errorMessage);
          setTasks([...tasks, newTask]);
        }
      } else {
        setTasks([...tasks, newTask]);
      }
    },
    [tasks, getUserId, showErrorToast, setTasks],
  );

  const updateTask = useCallback(
    async (taskId: string, updates: Partial<Task>) => {
      const userId = getUserId();

      // Optimistic update
      const oldTasks = [...tasks];
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
      );

      if (!userId) return;

      try {
        const fieldMapping: Record<string, string> = {
          completedAt: "completed_at",
          pomodoroCount: "pomodoro_count",
          dueDate: "due_date",
          startDate: "start_date",
          estimatedDuration: "estimated_duration",
          startTime: "start_time",
          endTime: "end_time",
          subDomain: "sub_domain",
        };

        const dbUpdates: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(updates)) {
          if (key === "status") continue;
          const dbKey = fieldMapping[key] || key;
          if (
            ["completed_at", "due_date", "start_date"].includes(dbKey) &&
            value !== null &&
            value !== undefined
          ) {
            dbUpdates[dbKey] = new Date(value as number).toISOString();
          } else {
            dbUpdates[dbKey] = value;
          }
        }

        await typedSupabaseClient
          .from("tasks")
          .update({ ...dbUpdates, updated_at: new Date().toISOString() })
          .eq("id", taskId)
          .eq("user_id", userId);
      } catch {
        setTasks(oldTasks);
        showErrorToast("Failed to save changes. Please try again.");
      }
    },
    [tasks, getUserId, showErrorToast, setTasks],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      const userId = getUserId();
      if (userId) {
        try {
          const { error } = await retryWithBackoff(async () => {
            const result = await supabaseClient
              .from("tasks")
              .delete()
              .eq("id", id)
              .eq("user_id", userId);
            if (result.error) throw result.error;
            return result;
          });

          if (error) throw error;
          setTasks(tasks.filter((task) => task.id !== id));
        } catch (error: unknown) {
          console.error("Error deleting task from DB:", error);
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to delete task from database";
          showErrorToast("Failed to Delete Task", errorMessage);
        }
      } else {
        setTasks(tasks.filter((task) => task.id !== id));
      }
    },
    [tasks, getUserId, showErrorToast, setTasks],
  );

  const toggleTask = useCallback(
    async (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;

      const newCompleted = !task.completed;
      const userId = getUserId();

      // Optimistic update
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === id
            ? {
                ...t,
                completed: newCompleted,
                completedAt: newCompleted ? Date.now() : undefined,
              }
            : t,
        ),
      );

      if (userId) {
        try {
          const now = Date.now();
          await typedSupabaseClient
            .from("tasks")
            .update({
              completed: newCompleted,
              completed_at: newCompleted ? new Date(now).toISOString() : null,
            })
            .eq("id", id)
            .eq("user_id", userId);
        } catch (error: unknown) {
          console.error("Error toggling task in DB:", error);
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to update task status";
          showErrorToast("Failed to Update Task", errorMessage);
        }
      }
    },
    [tasks, getUserId, showErrorToast, setTasks],
  );

  const incrementPomodoro = useCallback(
    async (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;

      const newCount = task.pomodoroCount + 1;
      const userId = getUserId();

      // Optimistic update
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === id ? { ...t, pomodoroCount: newCount } : t,
        ),
      );

      if (userId) {
        try {
          await typedSupabaseClient
            .from("tasks")
            .update({ pomodoro_count: newCount })
            .eq("id", id)
            .eq("user_id", userId);
        } catch (error: unknown) {
          console.error("Error incrementing pomodoro in DB:", error);
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to update pomodoro count";
          showErrorToast("Failed to Update Pomodoro", errorMessage);
        }
      }
    },
    [tasks, getUserId, showErrorToast, setTasks],
  );

  return {
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    incrementPomodoro,
  };
}
