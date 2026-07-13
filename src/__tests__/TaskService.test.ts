import { describe, it, expect } from "vitest";
import { TaskService } from "@/lib/domain/services/TaskService";
import type { Task } from "@/types";

const createTask = (overrides: Partial<Task> = {}): Task => ({
  id: `task-${Math.random()}`,
  title: "Test task",
  completed: false,
  createdAt: Date.now(),
  pomodoroCount: 0,
  ...overrides,
});

describe("TaskService", () => {
  describe("categorizeTasks", () => {
    it("should categorize empty tasks", () => {
      const result = TaskService.categorizeTasks([]);
      expect(result.active).toEqual([]);
      expect(result.completed).toEqual([]);
      expect(result.overdue).toEqual([]);
      expect(result.todayTasks).toEqual([]);
      expect(result.weekTasks).toEqual([]);
    });

    it("should categorize active tasks", () => {
      const tasks = [createTask({ status: "todo" }), createTask({ status: "in-progress" })];
      const result = TaskService.categorizeTasks(tasks);
      expect(result.active).toHaveLength(2);
    });

    it("should categorize completed tasks", () => {
      const tasks = [createTask({ completed: true }), createTask({ status: "done" })];
      const result = TaskService.categorizeTasks(tasks);
      expect(result.completed).toHaveLength(2);
    });

    it("should categorize overdue tasks", () => {
      const yesterday = Date.now() - 24 * 60 * 60 * 1000;
      const tasks = [createTask({ status: "todo", dueDate: yesterday })];
      const result = TaskService.categorizeTasks(tasks);
      expect(result.overdue).toHaveLength(1);
      expect(result.overdue[0].id).toBe(tasks[0].id);
    });

    it("should not categorize completed tasks as overdue", () => {
      const yesterday = Date.now() - 24 * 60 * 60 * 1000;
      const tasks = [createTask({ completed: true, dueDate: yesterday })];
      const result = TaskService.categorizeTasks(tasks);
      expect(result.overdue).toHaveLength(0);
    });
  });

  describe("calculateStats", () => {
    it("should calculate stats with no tasks", () => {
      const result = TaskService.calculateStats([]);
      expect(result.total).toBe(0);
      expect(result.completionRate).toBe(0);
      expect(result.failureRate).toBe(0);
    });

    it("should calculate completion rate", () => {
      const tasks = [
        createTask({ completed: true }),
        createTask({ completed: false }),
        createTask({ completed: true }),
      ];
      const result = TaskService.calculateStats(tasks);
      expect(result.completed).toBe(2);
      expect(result.total).toBe(3);
      expect(result.completionRate).toBeCloseTo(66.67, 1);
    });

    it("should calculate failure rate", () => {
      const tasks = [
        createTask({ failedAt: Date.now() }),
        createTask({ failedAt: Date.now() }),
        createTask({ completed: true }),
      ];
      const result = TaskService.calculateStats(tasks);
      expect(result.failed).toBe(2);
      expect(result.failureRate).toBeCloseTo(66.67, 1);
    });
  });

  describe("filterByPriority", () => {
    it("should filter tasks by priority", () => {
      const tasks = [
        createTask({ priority: "high" }),
        createTask({ priority: "low" }),
        createTask({ priority: "high" }),
      ];
      const highPriority = TaskService.filterByPriority(tasks, "high");
      expect(highPriority).toHaveLength(2);
      expect(highPriority.every((t) => t.priority === "high")).toBe(true);
    });
  });

  describe("filterByTag", () => {
    it("should filter tasks by tag", () => {
      const tasks = [
        createTask({ tags: ["work", "urgent"] }),
        createTask({ tags: ["personal"] }),
      ];
      const workTasks = TaskService.filterByTag(tasks, "work");
      expect(workTasks).toHaveLength(1);
      expect(workTasks[0].id).toBe(tasks[0].id);
    });
  });

  describe("sortByPriority", () => {
    it("should sort tasks by priority high to low", () => {
      const tasks = [
        createTask({ priority: "low" }),
        createTask({ priority: "high" }),
        createTask({ priority: "medium" }),
      ];
      const sorted = TaskService.sortByPriority(tasks);
      expect(sorted[0].priority).toBe("high");
      expect(sorted[1].priority).toBe("medium");
      expect(sorted[2].priority).toBe("low");
    });
  });

  describe("sortByDueDate", () => {
    it("should sort tasks by due date earliest first", () => {
      const tasks = [
        createTask({ dueDate: Date.now() + 1000 }),
        createTask({ dueDate: Date.now() - 1000 }),
      ];
      const sorted = TaskService.sortByDueDate(tasks);
      expect(sorted[0].dueDate).toBeLessThan(sorted[1].dueDate as number);
    });

    it("should put tasks without due date last", () => {
      const tasks = [
        createTask({ dueDate: Date.now() + 1000 }),
        createTask({}),
      ];
      const sorted = TaskService.sortByDueDate(tasks);
      expect(sorted[1].dueDate).toBeUndefined();
    });
  });

  describe("sortByOrder", () => {
    it("should sort tasks by order", () => {
      const tasks = [
        createTask({ order: 2 }),
        createTask({ order: 1 }),
      ];
      const sorted = TaskService.sortByOrder(tasks);
      expect(sorted[0].order).toBe(1);
      expect(sorted[1].order).toBe(2);
    });
  });

  describe("calculateProgress", () => {
    it("should return 100 for completed task without subtasks", () => {
      const task = createTask({ completed: true });
      expect(TaskService.calculateProgress(task)).toBe(100);
    });

    it("should calculate progress from subtasks", () => {
      const task = createTask({
        completed: false,
        subTasks: [
          { id: "1", title: "A", completed: true, createdAt: Date.now() },
          { id: "2", title: "B", completed: false, createdAt: Date.now() },
        ],
      });
      expect(TaskService.calculateProgress(task)).toBe(50);
    });
  });

  describe("isImminent", () => {
    it("should return true for task due within 24 hours", () => {
      const task = createTask({
        dueDate: Date.now() + 12 * 60 * 60 * 1000,
      });
      expect(TaskService.isImminent(task)).toBe(true);
    });

    it("should return false for completed task", () => {
      const task = createTask({
        completed: true,
        dueDate: Date.now() + 12 * 60 * 60 * 1000,
      });
      expect(TaskService.isImminent(task)).toBe(false);
    });
  });

  describe("isOverdue", () => {
    it("should return true for overdue task", () => {
      const task = createTask({
        dueDate: Date.now() - 1000,
      });
      expect(TaskService.isOverdue(task)).toBe(true);
    });

    it("should return false for postponed task", () => {
      const task = createTask({
        status: "postponed",
        dueDate: Date.now() - 1000,
      });
      expect(TaskService.isOverdue(task)).toBe(false);
    });
  });
});
