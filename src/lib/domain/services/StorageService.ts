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
import type { Json } from "@/lib/supabase/database.types";

export interface StorageOptions {
  /** Should sync with Supabase (default: true) */
  syncWithDb?: boolean;
  /** TTL in milliseconds for cache (default: none) */
  ttl?: number;
}

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

  /**
   * Clear all application data from localStorage
   * WARNING: This is destructive and removes all stored data
   */
  static clearAll(): void {
    if (typeof window === "undefined") return;

    const keysToKeep = ["theme", "settings"]; // Settings to preserve

    Object.values(STORAGE_KEYS).forEach((key) => {
      if (!keysToKeep.some((k) => key.includes(k))) {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error(`Failed to remove localStorage key ${key}:`, error);
        }
      }
    });
  }

  /**
   * Check if a key exists in localStorage
   */
  static hasLocal(key: StorageKey): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEYS[key]) !== null;
  }

  /**
   * Get all localStorage items for debugging
   */
  static getAllLocal(): Record<string, any> {
    if (typeof window === "undefined") return {};

    const items: Record<string, any> = {};
    Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
      const value = this.getLocal(key as StorageKey);
      if (value !== null) {
        items[storageKey] = value;
      }
    });
    return items;
  }

  /**
   * Get storage size in KB
   */
  static getStorageSize(): number {
    if (typeof window === "undefined") return 0;

    let size = 0;
    Object.values(STORAGE_KEYS).forEach((key) => {
      const item = localStorage.getItem(key);
      if (item) {
        size += item.length + key.length;
      }
    });
    return Math.round(size / 1024); // Convert to KB
  }
}
