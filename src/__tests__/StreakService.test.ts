import { describe, it, expect, beforeEach } from "vitest";
import { StreakService } from "@/lib/domain/services/StreakService";

describe("StreakService", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("calculateStreak", () => {
    it("should return zeros for empty sessions", () => {
      const result = StreakService.calculateStreak([]);
      expect(result.current).toBe(0);
      expect(result.longest).toBe(0);
      expect(result.lastActiveDate).toBeNull();
    });

    it("should calculate current streak from today", () => {
      const today = new Date().toISOString();
      const sessions = [
        { id: "1", user_id: "u1", completed_at: today, duration: 10, type: "task" },
        { id: "2", user_id: "u1", completed_at: today, duration: 5, type: "task" },
      ];
      const result = StreakService.calculateStreak(sessions);
      expect(result.current).toBe(1);
      expect(result.longest).toBe(1);
    });

    it("should calculate current streak from yesterday", () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const sessions = [
        { id: "1", user_id: "u1", completed_at: yesterday, duration: 10, type: "task" },
      ];
      const result = StreakService.calculateStreak(sessions);
      expect(result.current).toBe(1);
    });

    it("should return zero current streak if last activity is older than yesterday", () => {
      const oldDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const sessions = [
        { id: "1", user_id: "u1", completed_at: oldDate, duration: 10, type: "task" },
      ];
      const result = StreakService.calculateStreak(sessions);
      expect(result.current).toBe(0);
      expect(result.longest).toBe(0);
    });

    it("should calculate longest streak across multiple days", () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const dayBefore = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);

      const sessions = [
        { id: "1", user_id: "u1", completed_at: today.toISOString(), duration: 10, type: "task" },
        { id: "2", user_id: "u1", completed_at: yesterday.toISOString(), duration: 10, type: "task" },
        { id: "3", user_id: "u1", completed_at: dayBefore.toISOString(), duration: 10, type: "task" },
      ];

      const result = StreakService.calculateStreak(sessions);
      expect(result.current).toBe(3);
      expect(result.longest).toBe(3);
    });
  });

  describe("getTodayInUserTimezone", () => {
    it("should return today's date in YYYY-MM-DD format", () => {
      const today = StreakService.getTodayInUserTimezone();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("getStartOfDayInUserTimezone", () => {
    it("should return start of day at midnight UTC", () => {
      const startOfDay = StreakService.getStartOfDayInUserTimezone();
      expect(startOfDay.getUTCHours()).toBe(0);
      expect(startOfDay.getUTCMinutes()).toBe(0);
      expect(startOfDay.getUTCSeconds()).toBe(0);
      expect(startOfDay.getUTCMilliseconds()).toBe(0);
    });
  });
});
