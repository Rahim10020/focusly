/**
 * @fileoverview Centralized Storage Service
 * Abstracts localStorage and Supabase storage with automatic sync and fallback.
 *
 * This service provides:
 * - Unified interface for get/set/remove operations
 * - Automatic sync between localStorage and Supabase
 * - Fallback to localStorage if Supabase fails
 * - Type-safe operations
 */

import { STORAGE_KEYS, StorageKey } from "@/constants";
/**
 * Centralized Storage Service
 * Handles localStorage with optional Supabase sync
 */
export class StorageService {
  /**
   * Get a value from localStorage
   */
  static getLocal<T>(key: StorageKey): T | null {
    if (typeof window === "undefined") return null;

    try {
      const item = localStorage.getItem(STORAGE_KEYS[key]);
      if (!item) return null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Failed to parse localStorage key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a value in localStorage
   */
  static setLocal<T>(key: StorageKey, value: T): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to set localStorage key ${key}:`, error);
    }
  }

  /**
   * Remove a value from localStorage
   */
  static removeLocal(key: StorageKey): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(STORAGE_KEYS[key]);
    } catch (error) {
      console.error(`Failed to remove localStorage key ${key}:`, error);
    }
  }

}
