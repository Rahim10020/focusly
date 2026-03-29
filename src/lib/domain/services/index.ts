/**
 * @fileoverview Centralized Business Logic Services Barrel
 * All domain services exported from a single location.
 *
 * These services contain pure business logic independent of React and Storage.
 * They replace scattered logic from hooks and utilities.
 *
 * Usage:
 * import { TaskService, StatsService, DateTimeService } from '@/lib/domain/services';
 *
 * // Pure business logic - no side effects
 * const stats = TaskService.calculateStats(tasks);
 * const categorized = TaskService.categorizeTasks(tasks);
 * const streak = StatsService.calculateStreak(sessions);
 */

export { DateTimeService } from "./DateTimeService";
export {
  TaskService,
  type CategorizedTasks,
  type TaskStats,
} from "./TaskService";
export { StatsService, type StreakData } from "./StatsService";
export { StorageService } from "./StorageService";
export { CacheService } from "./CacheService";
export { RecurrenceService } from "./RecurrenceService";
export { FriendService } from "./FriendService";
export { StreakService } from "./StreakService";

// Re-export individual functions and types from utility services
export { generateDynamicInsights, type Insight } from "./InsightService";
export {
  getTaskCompletionStats,
  getDomainDistribution,
  formatHoursMinutesFromSeconds,
  getFocusHours,
  type TaskCompletionStats,
  type DomainDistributionItem,
} from "./StatsCalculationService";
export { exportCustomAnalyticsToPDF } from "./PDFExportService";
