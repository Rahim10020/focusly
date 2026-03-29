/**
 * @fileoverview Refactored Tasks Hook
 * Consolidates all task management into a single hook.
 * Uses domain services for all business logic.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "@/hooks/useAuth";
import { Task, Priority } from "@/types";
import { StorageService } from "@/lib/domain/services/StorageService";
import {
  TaskService,
  CategorizedTasks,
  TaskStats,
} from "@/lib/domain/services";
import { CreateTaskInput } from "@/types/task-input";
import { supabaseClient } from "@/lib/supabase/client";
import { mapTaskToDbInsert, mapDbTaskToTask } from "@/lib/supabase/mappers";
import { retryWithBackoff } from "@/lib/utils/retry";
import { useAppToast } from "./useAppToast";

interface UseTasksReturn {
  // Tasks state
  tasks: Task[];
  activeTaskId: string | null;
  loading: boolean;
  error: string | null;

  // Task actions
  addTask: (input: CreateTaskInput) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  incrementPomodoro: (id: string) => Promise<void>;
  setActiveTask: (id: string | null) => void;

  // SubTask actions
  addSubTask: (taskId: string, title: string) => Promise<void>;
  toggleSubTask: (taskId: string, subTaskId: string) => Promise<void>;
  deleteSubTask: (taskId: string, subTaskId: string) => Promise<void>;

  // Filters
  getActiveTasks: () => Task[];
  getCompletedTasks: () => Task[];
  getTasksByPriority: (priority: Priority) => Task[];
  getTasksByTag: (tagId: string) => Task[];
  getOverdueTasks: () => Task[];
  sortTasksByPriority: (tasksToSort: Task[]) => Task[];
  sortTasksByOrder: (tasksToSort: Task[]) => Task[];

  // Reorder & utilities
  reorderTasks: (startIndex: number, endIndex: number) => Promise<void>;
  categorized: CategorizedTasks;
  stats: TaskStats;
  getTaskById: (id: string) => Task | undefined;
}

export function useTasks(): UseTasksReturn {
  const { data: session } = useSession();
  const { actionError } = useAppToast();

  // State
  const [tasks, setTasks] = useState<Task[]>(
    () => StorageService.getLocal("TASKS") || [],
  );

  const [activeTaskId, setActiveTaskId] = useState<string | null>(() =>
    StorageService.getLocal("ACTIVE_TASK"),
  );

  const [loading, setLoading] = useState(!session);
  const [error, setError] = useState<string | null>(null);

  // Initialize from localStorage on mount
  useEffect(() => {
    const localTasks = StorageService.getLocal<Task[]>("TASKS");
    const localActiveId = StorageService.getLocal<string>("ACTIVE_TASK");
    if (localTasks) setTasks(localTasks);
    if (localActiveId) setActiveTaskId(localActiveId);

    if (session?.user?.id) {
      loadFromSupabase();
    }
  }, [session?.user?.id]);

  // Persist to localStorage on change
  useEffect(() => {
    StorageService.setLocal("TASKS", tasks);
  }, [tasks]);

  useEffect(() => {
    if (activeTaskId) {
      StorageService.setLocal("ACTIVE_TASK", activeTaskId);
    }
  }, [activeTaskId]);

  /**
   * Load tasks from Supabase (for authenticated users)
   */
  const loadFromSupabase = useCallback(async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: err } = await retryWithBackoff(async () => {
        return supabaseClient
          .from("tasks")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });
      });

      if (err) throw err;
      if (data) {
        const mappedTasks = data.map((t) => mapDbTaskToTask(t));
        setTasks(mappedTasks);
      }
    } catch (err) {
      console.error("Failed to load tasks from Supabase:", err);
      setError("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  /**
   * Add a new task
   */
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

      // Optimistic update
      setTasks((prev) => [...prev, newTask]);

      // Sync to Supabase if authenticated
      if (session?.user?.id) {
        try {
          const dbData = mapTaskToDbInsert(newTask, session.user.id);
          await retryWithBackoff(async () => {
            return supabaseClient.from("tasks").insert(dbData as any);
          });
        } catch (err) {
          console.error("Failed to save task:", err);
          actionError("Failed to save task");
        }
      }
    },
    [tasks, session?.user?.id, actionError],
  );

  /**
   * Update a task
   */
  const updateTask = useCallback(
    async (taskId: string, updates: Partial<Task>) => {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
      );

      if (session?.user?.id) {
        try {
          await retryWithBackoff(async () => {
            return supabaseClient
              .from("tasks")
              .update(updates as any)
              .eq("id", taskId)
              .eq("user_id", session.user.id);
          });
        } catch (err) {
          console.error("Failed to update task:", err);
          actionError("Failed to update task");
        }
      }
    },
    [session?.user?.id, actionError],
  );

  /**
   * Delete a task
   */
  const deleteTask = useCallback(
    async (taskId: string) => {
      // Optimistic delete
      setTasks((prev) => prev.filter((t) => t.id !== taskId));

      if (session?.user?.id) {
        try {
          await retryWithBackoff(async () => {
            return supabaseClient
              .from("tasks")
              .delete()
              .eq("id", taskId)
              .eq("user_id", session.user.id);
          });
        } catch (err) {
          console.error("Failed to delete task:", err);
          actionError("Failed to delete task");
        }
      }
    },
    [session?.user?.id, actionError],
  );

  /**
   * Toggle task completion
   */
  const toggleTask = useCallback(
    async (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      await updateTask(taskId, {
        completed: !task.completed,
        completedAt: !task.completed ? Date.now() : undefined,
        status: !task.completed ? "done" : "todo",
      });
    },
    [tasks, updateTask],
  );

  /**
   * Increment Pomodoro count
   */
  const incrementPomodoro = useCallback(
    async (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      await updateTask(taskId, {
        pomodoroCount: (task.pomodoroCount || 0) + 1,
      });
    },
    [tasks, updateTask],
  );

  /**
   * Add a subtask
   */
  const addSubTask = useCallback(
    async (taskId: string, title: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const newSubTask = {
        id: Date.now().toString(),
        title,
        completed: false,
        createdAt: Date.now(),
      };

      await updateTask(taskId, {
        subTasks: [...(task.subTasks || []), newSubTask],
      });
    },
    [tasks, updateTask],
  );

  /**
   * Toggle subtask
   */
  const toggleSubTask = useCallback(
    async (taskId: string, subTaskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const updatedSubTasks = (task.subTasks || []).map((st) =>
        st.id === subTaskId
          ? {
              ...st,
              completed: !st.completed,
              completedAt: !st.completed ? Date.now() : undefined,
            }
          : st,
      );

      await updateTask(taskId, { subTasks: updatedSubTasks });
    },
    [tasks, updateTask],
  );

  /**
   * Delete subtask
   */
  const deleteSubTask = useCallback(
    async (taskId: string, subTaskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      await updateTask(taskId, {
        subTasks: (task.subTasks || []).filter((st) => st.id !== subTaskId),
      });
    },
    [tasks, updateTask],
  );

  /**
   * Reorder tasks (drag & drop)
   */
  const reorderTasks = useCallback(
    async (startIndex: number, endIndex: number) => {
      const sorted = TaskService.sortByOrder(tasks);
      const [removed] = sorted.splice(startIndex, 1);
      sorted.splice(endIndex, 0, removed);

      const reordered = sorted.map((task, index) => ({
        ...task,
        order: index,
      }));

      setTasks(reordered);

      if (session?.user?.id) {
        try {
          // Batch update orders
          for (const task of reordered) {
            await retryWithBackoff(async () => {
              return supabaseClient
                .from("tasks")
                .update({ order: task.order } as any)
                .eq("id", task.id);
            });
          }
        } catch (err) {
          console.error("Failed to reorder tasks:", err);
        }
      }
    },
    [tasks, session?.user?.id],
  );

  /**
   * Set the active task
   */
  const setActiveTask = useCallback((taskId: string | null) => {
    setActiveTaskId(taskId);
  }, []);

  // Filtering functions using TaskService
  const getActiveTasks = useCallback(
    () => TaskService.categorizeTasks(tasks).active,
    [tasks],
  );
  const getCompletedTasks = useCallback(
    () => TaskService.categorizeTasks(tasks).completed,
    [tasks],
  );
  const getTasksByPriority = useCallback(
    (priority: Priority) => TaskService.filterByPriority(tasks, priority),
    [tasks],
  );
  const getTasksByTag = useCallback(
    (tagId: string) => TaskService.filterByTag(tasks, tagId),
    [tasks],
  );
  const getOverdueTasks = useCallback(
    () => TaskService.categorizeTasks(tasks).overdue,
    [tasks],
  );
  const sortTasksByPriority = useCallback(
    (tasksToSort: Task[]) => TaskService.sortByPriority(tasksToSort),
    [],
  );
  const sortTasksByOrder = useCallback(
    (tasksToSort: Task[]) => TaskService.sortByOrder(tasksToSort),
    [],
  );

  // Memoized computed values
  const categorized = useMemo(
    () => TaskService.categorizeTasks(tasks),
    [tasks],
  );
  const stats = useMemo(() => TaskService.calculateStats(tasks), [tasks]);
  const getTaskById = useCallback(
    (id: string) => tasks.find((t) => t.id === id),
    [tasks],
  );

  return {
    tasks,
    activeTaskId,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    incrementPomodoro,
    setActiveTask,
    addSubTask,
    toggleSubTask,
    deleteSubTask,
    getActiveTasks,
    getCompletedTasks,
    getTasksByPriority,
    getTasksByTag,
    getOverdueTasks,
    sortTasksByPriority,
    sortTasksByOrder,
    reorderTasks,
    categorized,
    stats,
    getTaskById,
  };
}
