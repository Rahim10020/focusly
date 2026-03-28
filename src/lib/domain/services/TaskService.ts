/**
 * @fileoverview Centralized Task Business Logic Service
 * Consolidates all task-related operations and queries from dispersed hooks and utilities.
 *
 * Replaces logic from:
 * - useTaskActions, useTaskFilters, useTaskStorage, useTaskReorder
 * - TaskCategorizationService
 * - taskUtils
 */

import { Task } from "@/types";
import { DateTimeService } from "./DateTimeService";

/**
 * Categorized task collection with all possible groupings
 */
export interface CategorizedTasks {
  active: Task[];
  inProgress: Task[];
  upcoming: Task[];
  completed: Task[];
  failed: Task[];
  overdue: Task[];
  postponed: Task[];
  cancelled: Task[];
  todayTasks: Task[];
  weekTasks: Task[];
}

/**
 * Task statistics derived from categorization
 */
export interface TaskStats {
  total: number;
  active: number;
  completed: number;
  failed: number;
  overdue: number;
  postponed: number;
  cancelled: number;
  completionRate: number;
  failureRate: number;
}

/**
 * Centralized Task Service
 * All task-related business logic in one place
 */
export class TaskService {
  /**
   * Categorize tasks into all possible groupings
   */
  static categorizeTasks(tasks: Task[]): CategorizedTasks {
    const now = new Date();
    const todayStart = DateTimeService.getStartOfDayInUserTimezone();
    const todayEnd = DateTimeService.getEndOfDayInUserTimezone();
    const weekEndDate = DateTimeService.getEndOfWeek();

    const categorized = {
      active: tasks.filter(
        (t) => t.status === "todo" || t.status === "in-progress",
      ),
      inProgress: tasks.filter(
        (t) => t.status === "in-progress" && !t.completed && !t.failedAt,
      ),
      upcoming: tasks.filter(
        (t) =>
          !!t.dueDate &&
          t.dueDate > now.getTime() &&
          !t.completed &&
          !t.failedAt,
      ),
      completed: tasks.filter((t) => t.status === "done" || t.completed),
      failed: tasks.filter((t) => t.failedAt !== undefined),
      overdue: tasks.filter(
        (t) =>
          (t.status === "todo" || t.status === "in-progress") &&
          !t.completed &&
          t.dueDate &&
          t.dueDate < now.getTime(),
      ),
      postponed: tasks.filter((t) => t.status === "postponed"),
      cancelled: tasks.filter((t) => t.status === "cancelled"),
      todayTasks: tasks.filter(
        (t) =>
          t.dueDate &&
          t.dueDate >= todayStart.getTime() &&
          t.dueDate <= todayEnd.getTime() &&
          !t.completed &&
          t.status !== "postponed",
      ),
      weekTasks: tasks.filter(
        (t) =>
          t.dueDate &&
          t.dueDate >= todayStart.getTime() &&
          t.dueDate <= weekEndDate.getTime() &&
          !t.completed &&
          t.status !== "postponed",
      ),
    };

    return categorized;
  }

  /**
   * Calculate task statistics from a task collection
   */
  static calculateStats(tasks: Task[]): TaskStats {
    const categorized = this.categorizeTasks(tasks);
    const activeTasks = tasks.length - (categorized.cancelled?.length || 0);

    return {
      total: tasks.length,
      active: categorized.active.length,
      completed: categorized.completed.length,
      failed: categorized.failed.length,
      overdue: categorized.overdue.length,
      postponed: categorized.postponed?.length || 0,
      cancelled: categorized.cancelled?.length || 0,
      completionRate:
        activeTasks > 0
          ? (categorized.completed.length / activeTasks) * 100
          : 0,
      failureRate:
        activeTasks > 0 ? (categorized.failed.length / activeTasks) * 100 : 0,
    };
  }

  /**
   * Get all tasks by priority
   */
  static filterByPriority(tasks: Task[], priority: "low" | "medium" | "high") {
    return tasks.filter((t) => t.priority === priority);
  }

  /**
   * Get all tasks by tag ID
   */
  static filterByTag(tasks: Task[], tagId: string): Task[] {
    return tasks.filter((t) => t.tags?.includes(tagId));
  }

  /**
   * Sort tasks by priority (high → low)
   */
  static sortByPriority(tasks: Task[]): Task[] {
    const priorityMap = { high: 3, medium: 2, low: 1 };
    return [...tasks].sort(
      (a, b) =>
        (priorityMap[b.priority as keyof typeof priorityMap] || 0) -
        (priorityMap[a.priority as keyof typeof priorityMap] || 0),
    );
  }

  /**
   * Sort tasks by due date (earliest first)
   */
  static sortByDueDate(tasks: Task[]): Task[] {
    return [...tasks].sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate - b.dueDate;
    });
  }

  /**
   * Sort tasks by order (for drag & drop)
   */
  static sortByOrder(tasks: Task[]): Task[] {
    return [...tasks].sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  /**
   * Calculate task progress from subtasks
   */
  static calculateProgress(task: Task): number {
    if (!task.subTasks || task.subTasks.length === 0) {
      return task.completed ? 100 : 0;
    }
    const completedCount = task.subTasks.filter((st) => st.completed).length;
    return Math.round((completedCount / task.subTasks.length) * 100);
  }

  /**
   * Check if a task is imminent (due within 24 hours and not completed)
   */
  static isImminent(task: Task): boolean {
    if (!task.dueDate || task.completed || task.failedAt) return false;
    const now = new Date().getTime();
    const imminentThreshold = now + 24 * 60 * 60 * 1000; // 24 hours
    return task.dueDate > now && task.dueDate <= imminentThreshold;
  }

  /**
   * Check if a task is overdue
   */
  static isOverdue(task: Task): boolean {
    if (!task.dueDate || task.completed || task.status === "postponed")
      return false;
    return task.dueDate < new Date().getTime();
  }

  /**
   * Get all imminent tasks from a collection
   */
  static getImminentTasks(tasks: Task[]): Task[] {
    return tasks.filter((t) => this.isImminent(t));
  }
}
