import { describe, it, expect } from "vitest";
import {
  mapDbTaskToTask,
  mapTaskToDbInsert,
  mapTaskUpdateToDb,
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
      subTasks: [],
      order: 1,
      subDomain: "professional",
      version: 1,
    };

    const db = mapTaskToDbInsert(task, "user-1");
    expect(db.user_id).toBe("user-1");
    expect(db.title).toBe("Test");
    expect(db.due_date).toBe("2026-01-02T00:00:00.000Z");
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
