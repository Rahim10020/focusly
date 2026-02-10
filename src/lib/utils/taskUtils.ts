/**
 * @fileoverview Task utility functions.
 * Helper functions for task scheduling and filtering.
 */

import { Task } from '@/types';

/**
 * Combines a date timestamp with a time string to create a full datetime timestamp.
 * @param timestamp - The base date timestamp in milliseconds
 * @param startTime - Optional time string in "HH:MM" format
 * @returns The combined timestamp, or original timestamp if no valid time provided
 */
export const combineDateAndTime = (timestamp: number, startTime?: string): number => {
  if (!startTime) return timestamp;
  const [hoursStr, minutesStr] = startTime.split(':');
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return timestamp;
  }
  const date = new Date(timestamp);
  date.setHours(hours, minutes, 0, 0);
  return date.getTime();
};

/**
 * Retrieves the scheduling timestamp for a task, prioritizing start date over due date.
 * @param task - The task to get the schedule timestamp for
 * @returns The timestamp for scheduling, or null if no dates are set
 */
export const getTaskScheduleTimestamp = (task: Task): number | null => {
  if (task.startDate) {
    return combineDateAndTime(task.startDate, task.startTime);
  }
  if (task.dueDate) {
    return task.dueDate;
  }
  return null;
};

/**
 * Retrieves the most imminent active tasks, sorted by schedule date then creation date.
 * @param tasks - Array of all tasks
 * @param limit - Maximum number of tasks to return (default: 5)
 * @returns Array of the most imminent active tasks
 */
export const getImminentTasks = (tasks: Task[], limit = 5): Task[] => {
  const activeTasks = tasks.filter(task => !task.completed);

  const scheduledTasks = activeTasks
    .map(task => ({ task, scheduledAt: getTaskScheduleTimestamp(task) }))
    .filter(item => item.scheduledAt !== null)
    .sort((a, b) => (a.scheduledAt! - b.scheduledAt!))
    .map(item => item.task);

  const fallbackTasks = activeTasks
    .filter(task => getTaskScheduleTimestamp(task) === null)
    .sort((a, b) => a.createdAt - b.createdAt);

  return [...scheduledTasks, ...fallbackTasks].slice(0, limit);
};

/**
 * Get all imminent tasks without limit
 * @param tasks - Array of all tasks
 * @returns Array of all imminent active tasks
 */
export const getAllImminentTasks = (tasks: Task[]): Task[] => {
  return getImminentTasks(tasks, Infinity);
};
