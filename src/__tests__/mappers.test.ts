import { describe, it, expect } from "vitest";
import {
  mapDbTaskToTask,
  mapTaskToDbInsert,
  mapTaskUpdateToDb,
  mapSubTaskToDbInsert,
} from "@/lib/supabase/mappers";
import type { Task } from "@/types";

const baseDbTask = {
  id: "task-1",
  title: "Test",
  completed: false,
  status: "todo",
  created_at: "2026-01-01T00:00:00Z",
  completed_at: null,
  failed_at: null,
  pomodoro_count: 0,
  priority: "high",
  tags: ["work"],
  due_date: "2026-01-02T00:00:00Z",
  start_date: null,
  start_time: "09:00",
  end_time: "10:00",
  estimated_duration: 60,
  notes: "notes",
  subtasks: [],
  order: 1,
  sub_domain: "professional",
  version: 1,
  is_recurring: true,
  recurrence_pattern: "weekly",
  recurrence_interval: 2,
  recurrence_days_of_week: [1, 3],
  recurrence_end_date: "2026-03-01",
  parent_recurring_task_id: "parent-1",
};

describe("mappers", () => {
  it("should map db task to app task", () => {
    const task = mapDbTaskToTask(baseDbTask);
    expect(task.id).toBe("task-1");
    expect(task.title).toBe("Test");
    expect(task.status).toBe("todo");
    expect(task.completed).toBe(false);
    expect(task.dueDate).toBe(new Date("2026-01-02T00:00:00Z").getTime());
    expect(task.tags).toEqual(["work"]);
  });

  it("should map recurrence fields from db task to app task", () => {
    const task = mapDbTaskToTask(baseDbTask);
    expect(task.isRecurring).toBe(true);
    expect(task.recurrencePattern).toBe("weekly");
    expect(task.recurrenceInterval).toBe(2);
    expect(task.recurrenceDaysOfWeek).toEqual([1, 3]);
    expect(task.recurrenceEndDate).toBe("2026-03-01");
    expect(task.parentRecurringTaskId).toBe("parent-1");
  });

  it("should map app task to db insert", () => {
    const task: Task = {
      id: "task-1",
      title: "Test",
      completed: false,
      createdAt: new Date("2026-01-01T00:00:00Z").getTime(),
      pomodoroCount: 0,
      priority: "high",
      tags: ["work"],
      dueDate: new Date("2026-01-02T00:00:00Z").getTime(),
      startTime: "09:00",
      endTime: "10:00",
      estimatedDuration: 60,
      notes: "notes",
      subTasks: [{ id: "subtask-1", title: "First step", completed: false, createdAt: new Date("2026-01-01T00:00:00Z").getTime() }],
      order: 1,
      subDomain: "professional",
      version: 1,
    };

    const db = mapTaskToDbInsert(task, "user-1");
    expect(db.user_id).toBe("user-1");
    expect(db.id).toBe("task-1");
    expect(db.title).toBe("Test");
    expect(db.due_date).toBe("2026-01-02T00:00:00.000Z");
    expect(db.subtasks).toBeUndefined();
  });

  it("should not map subtasks into tasks updates", () => {
    const db = mapTaskUpdateToDb({ subTasks: [{ id: "s1", title: "x", completed: false, createdAt: 0 }] });
    expect(db.subtasks).toBeUndefined();
  });

  it("should map subtask to db insert", () => {
    const db = mapSubTaskToDbInsert(
      { id: "subtask-1", title: "First step", completed: true, createdAt: new Date("2026-01-01T00:00:00Z").getTime(), completedAt: new Date("2026-01-02T00:00:00Z").getTime() },
      "task-1",
    );
    expect(db.task_id).toBe("task-1");
    expect(db.title).toBe("First step");
    expect(db.completed).toBe(true);
    expect(db.completed_at).toBe("2026-01-02T00:00:00.000Z");
  });

  it("should map recurrence fields to db insert", () => {
    const task: Task = {
      id: "task-1",
      title: "Recurring",
      completed: false,
      createdAt: new Date("2026-01-01T00:00:00Z").getTime(),
      pomodoroCount: 0,
      isRecurring: true,
      recurrencePattern: "weekly",
      recurrenceInterval: 2,
      recurrenceDaysOfWeek: [1, 3],
      recurrenceEndDate: "2026-03-01",
      parentRecurringTaskId: "parent-1",
    };

    const db = mapTaskToDbInsert(task, "user-1");
    expect(db.id).toBe("task-1");
    expect(db.is_recurring).toBe(true);
    expect(db.recurrence_pattern).toBe("weekly");
    expect(db.recurrence_interval).toBe(2);
    expect(db.recurrence_days_of_week).toEqual([1, 3]);
    expect(db.recurrence_end_date).toBe("2026-03-01");
    expect(db.parent_recurring_task_id).toBe("parent-1");
  });

  it("should map app task updates to db updates", () => {
    const updates: Partial<Task> = {
      completed: true,
      completedAt: new Date("2026-01-02T00:00:00Z").getTime(),
      tags: ["personal"],
    };

    const db = mapTaskUpdateToDb(updates);
    expect(db.completed).toBe(true);
    expect(db.completed_at).toBe("2026-01-02T00:00:00.000Z");
    expect(db.tags).toEqual(["personal"]);
  });

  it("should exclude status from db updates", () => {
    const updates: Partial<Task> = {
      status: "done" as Task["status"],
    };

    const db = mapTaskUpdateToDb(updates);
    expect(db.status).toBeUndefined();
  });
});
