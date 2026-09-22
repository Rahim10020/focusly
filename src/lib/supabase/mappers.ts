/**
 * @fileoverview Database Type Mappers
 * Convert between Supabase DB types and application TypeScript types
 */

import { Task, PomodoroSession, SubTask } from "@/types";

/**
 * Map a subtask row (from get_tasks_with_subtasks JSONB) to app SubTask type
 */
function mapDbSubTaskToSubTask(dbSub: Record<string, any>): SubTask {
  return {
    id: dbSub.id,
    title: dbSub.title,
    completed: dbSub.completed || false,
    createdAt: dbSub.created_at
      ? new Date(dbSub.created_at).getTime()
      : Date.now(),
    completedAt: dbSub.completed_at
      ? new Date(dbSub.completed_at).getTime()
      : undefined,
    order: dbSub.order ?? undefined,
  };
}

/**
 * Map database task row to application Task type
 */
export function mapDbTaskToTask(dbTask: Record<string, any>): Task {
  return {
    id: dbTask.id,
    isRecurring: dbTask.is_recurring || undefined,
    recurrencePattern: dbTask.recurrence_pattern || undefined,
    recurrenceInterval: dbTask.recurrence_interval || undefined,
    recurrenceDaysOfWeek: dbTask.recurrence_days_of_week || undefined,
    recurrenceEndDate: dbTask.recurrence_end_date || undefined,
    parentRecurringTaskId: dbTask.parent_recurring_task_id || undefined,
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
    subTasks: Array.isArray(dbTask.subtasks)
      ? dbTask.subtasks.map((s: Record<string, any>) =>
          mapDbSubTaskToSubTask(s),
        )
      : [],
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
    id: task.id,
    user_id: userId,
    title: task.title,
    completed: task.completed,
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
    is_recurring: task.isRecurring || false,
    recurrence_pattern: task.recurrencePattern || null,
    recurrence_interval: task.recurrenceInterval || 1,
    recurrence_days_of_week: task.recurrenceDaysOfWeek || null,
    recurrence_end_date: task.recurrenceEndDate || null,
    parent_recurring_task_id: task.parentRecurringTaskId || null,
  };
}

/**
 * Map application Task partial updates to database format
 * Convertit les données mises à jour depuis l'app vers le format Supabase
 * NOTE: `status` est une propriété calculée (non stockée dans la DB), on l'exclut
 */
export function mapTaskUpdateToDb(updates: Partial<Task>): Record<string, any> {
  const dbUpdates: Record<string, any> = {};

  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
  // NOTE: La colonne "status" n'existe pas dans la table tasks - on l'exclut volontairement
  // status est calculé à la lecture : status = completed ? "done" : "todo"
  if (updates.completedAt !== undefined) {
    dbUpdates.completed_at = updates.completedAt
      ? new Date(updates.completedAt).toISOString()
      : null;
  }
  if (updates.failedAt !== undefined) {
    dbUpdates.failed_at = updates.failedAt
      ? new Date(updates.failedAt).toISOString()
      : null;
  }
  if (updates.pomodoroCount !== undefined)
    dbUpdates.pomodoro_count = updates.pomodoroCount;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
  if (updates.dueDate !== undefined) {
    dbUpdates.due_date = updates.dueDate
      ? new Date(updates.dueDate).toISOString()
      : null;
  }
  if (updates.startDate !== undefined) {
    dbUpdates.start_date = updates.startDate
      ? new Date(updates.startDate).toISOString()
      : null;
  }
  if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime;
  if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime;
  if (updates.estimatedDuration !== undefined)
    dbUpdates.estimated_duration = updates.estimatedDuration;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
  if (updates.order !== undefined) dbUpdates.order = updates.order;
  if (updates.subDomain !== undefined) dbUpdates.sub_domain = updates.subDomain;
  if (updates.version !== undefined) dbUpdates.version = updates.version;
  if (updates.isRecurring !== undefined) dbUpdates.is_recurring = updates.isRecurring;
  if (updates.recurrencePattern !== undefined) dbUpdates.recurrence_pattern = updates.recurrencePattern;
  if (updates.recurrenceInterval !== undefined) dbUpdates.recurrence_interval = updates.recurrenceInterval;
  if (updates.recurrenceDaysOfWeek !== undefined) dbUpdates.recurrence_days_of_week = updates.recurrenceDaysOfWeek;
  if (updates.recurrenceEndDate !== undefined) dbUpdates.recurrence_end_date = updates.recurrenceEndDate;

  return dbUpdates;
}

/**
 * Map application SubTask to database insert object
 */
export function mapSubTaskToDbInsert(
  subTask: SubTask,
  taskId: string,
): Record<string, any> {
  return {
    task_id: taskId,
    title: subTask.title,
    completed: subTask.completed || false,
    completed_at: subTask.completedAt
      ? new Date(subTask.completedAt).toISOString()
      : null,
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
  };
}
