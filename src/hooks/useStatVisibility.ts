/**
 * @fileoverview Stat visibility settings hook.
 * Manages user preferences for which statistics are visible
 * to friends, with database persistence via Supabase.
 */

import { useState, useEffect, useCallback } from "react";
import { getSupabaseClientOrNull } from "@/lib/supabase/client";
import { useSession } from "@/hooks/useAuth";

/**
 * Represents a single stat visibility setting.
 * @interface StatVisibility
 */
export interface StatVisibility {
  /** Name of the statistic field */
  stat_field: string;
  /** Whether this stat is visible to friends */
  visible_to_friends: boolean;
}

const STAT_FIELDS = [
  "total_sessions",
  "completed_tasks",
  "total_tasks",
  "streak",
  "total_focus_time",
  "longest_streak",
  "tasks_completed_today",
] as const;

/**
 * Hook for managing stat visibility preferences.
 * Controls which user statistics are visible to friends.
 * Settings are persisted to Supabase.
 *
 * @example
 * const { visibilitySettings, loading, updateVisibility } = useStatVisibility();
 *
 * // Render visibility toggles
 * {visibilitySettings.map(setting => (
 *   <Toggle
 *     key={setting.stat_field}
 *     checked={setting.visible_to_friends}
 *     onChange={(checked) => updateVisibility(setting.stat_field, checked)}
 *   />
 * ))}
 *
 * // Update a specific stat visibility
 * await updateVisibility('total_sessions', false);
 */
export function useStatVisibility() {
  const { data: session } = useSession();
  const [visibilitySettings, setVisibilitySettings] = useState<
    StatVisibility[]
  >([]);
  const [loading, setLoading] = useState(true);

  const fetchVisibilitySettings = useCallback(async () => {
    try {
      const userId = session?.user?.id;
      if (!userId) return;
      const supabase = getSupabaseClientOrNull();
      if (!supabase) return;

      const { data, error } = await supabase
        .from("stat_visibility")
        .select("stat_field, visible_to_friends")
        .eq("user_id", userId);

      if (error) throw error;

      // Create default settings for missing fields
      const existingSettings = new Map(
        data?.map((s) => [s.stat_field, s.visible_to_friends]) ?? [],
      );
      const allSettings = STAT_FIELDS.map((field) => ({
        stat_field: field,
        visible_to_friends: (existingSettings.get(field) ?? true) as boolean,
      }));

      setVisibilitySettings(allSettings);
    } catch (error) {
      console.error("Error fetching stat visibility:", error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchVisibilitySettings();
    } else {
      setLoading(false);
    }
  }, [session?.user?.id, fetchVisibilitySettings]);

  const updateVisibility = async (statField: string, visible: boolean) => {
    try {
      const userId = session?.user?.id;
      if (!userId) return;
      const supabase = getSupabaseClientOrNull();
      if (!supabase) return;

      const { error } = await supabase.from("stat_visibility").upsert({
        user_id: userId,
        stat_field: statField,
        visible_to_friends: visible,
      });

      if (error) throw error;

      setVisibilitySettings((prev) =>
        prev.map((setting) =>
          setting.stat_field === statField
            ? { ...setting, visible_to_friends: visible }
            : setting,
        ),
      );
    } catch (error) {
      console.error("Error updating stat visibility:", error);
    }
  };

  return {
    visibilitySettings,
    loading,
    updateVisibility,
  };
}
