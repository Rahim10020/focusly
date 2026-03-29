/**
 * @fileoverview Database Type Mappers
 * Convert between Supabase DB types and application TypeScript types
 */

import { Task, PomodoroSession } from "@/types";

/**
 * Map database task row to application Task type
 */
export function mapDbTaskToTask(dbTask: Record<string, any>): Task {
  return {
    id: dbTask.id,
    title: dbTask.title,
    completed: dbTask.completed || false,
    status: dbTask.status || (dbTask.completed ? "done" : "todo"),
    createdAt: new Date(dbTask.created_at).getTime(),
    completedAt: dbTask.completed_at
      ? new Date(dbTask.completed_at).getTime()
      : undefined,
    failedAt: dbTask.failed_at
      ? new Date(dbTask.failed_at).getTime()
      : undefined,
    pomodoroCount: dbTask.pomodoro_count || 0,
    priority: dbTask.priority,
    tags: dbTask.tags || [],
    dueDate: dbTask.due_date ? new Date(dbTask.due_date).getTime() : undefined,
    startDate: dbTask.start_date
      ? new Date(dbTask.start_date).getTime()
      : undefined,
    startTime: dbTask.start_time,
    endTime: dbTask.end_time,
    estimatedDuration: dbTask.estimated_duration,
    notes: dbTask.notes,
    subTasks: dbTask.subtasks || [],
    order: dbTask.order,
    subDomain: dbTask.sub_domain,
    version: dbTask.version,
  };
}

/**
 * Map database session row to application PomodoroSession type
 */
export function mapDbSessionToSession(
  dbSession: Record<string, any>,
): PomodoroSession {
  return {
    id: dbSession.id,
    startedAt: new Date(dbSession.started_at || dbSession.created_at).getTime(),
    duration: dbSession.duration,
    type: (dbSession.type || "work") as "work" | "break",
    completed: dbSession.completed || false,
    taskId: dbSession.task_id,
  };
}

/**
 * Map application Task to database insert object
 */
export function mapTaskToDbInsert(
  task: Task,
  userId: string,
): Record<string, any> {
  return {
    user_id: userId,
    title: task.title,
    completed: task.completed,
    status: task.status,
    created_at: new Date(task.createdAt).toISOString(),
    completed_at: task.completedAt
      ? new Date(task.completedAt).toISOString()
      : null,
    failed_at: task.failedAt ? new Date(task.failedAt).toISOString() : null,
    pomodoro_count: task.pomodoroCount,
    priority: task.priority,
    tags: task.tags,
    due_date: task.dueDate ? new Date(task.dueDate).toISOString() : null,
    start_date: task.startDate ? new Date(task.startDate).toISOString() : null,
    start_time: task.startTime,
    end_time: task.endTime,
    estimated_duration: task.estimatedDuration,
    notes: task.notes,
    order: task.order,
    sub_domain: task.subDomain,
    version: task.version,
  };
}

/**
 * Map application PomodoroSession to database insert object
 */
export function mapSessionToDbInsert(
  session: PomodoroSession,
  userId: string,
): Record<string, any> {
  return {
    user_id: userId,
    task_id: session.taskId,
    duration: session.duration,
    type: session.type,
    completed: session.completed,
    started_at: new Date(session.startedAt).toISOString(),
    created_at: new Date(session.startedAt).toISOString(),
  };
}
