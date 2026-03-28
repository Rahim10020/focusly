/**
 * @fileoverview Domain Layer - Centralized Business Logic
 * All business logic services that are independent of React, Storage, and API layers.
 *
 * This layer contains:
 * - Pure business logic functions
 * - Domain models and interfaces
 * - Services with no side effects
 * - Independent of React hooks, localStorage, or Supabase
 *
 * Usage:
 * import { TaskService, StatsService } from '@/lib/domain';
 */

export * from "./services";
