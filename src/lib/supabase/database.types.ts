export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cache: {
        Row: {
          cache_key: string
          created_at: string
          data: Json
          expires_at: string
          id: string
          updated_at: string
        }
        Insert: {
          cache_key: string
          created_at?: string
          data: Json
          expires_at: string
          id?: string
          updated_at?: string
        }
        Update: {
          cache_key?: string
          created_at?: string
          data?: Json
          expires_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      friends: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "friends_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friends_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          count: number | null
          created_at: string
          id: string
          identifier: string
          reset_time: string
          updated_at: string
        }
        Insert: {
          count?: number | null
          created_at?: string
          id?: string
          identifier: string
          reset_time: string
          updated_at?: string
        }
        Update: {
          count?: number | null
          created_at?: string
          id?: string
          identifier?: string
          reset_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          duration: number
          id: string
          started_at: string | null
          task_id: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          duration: number
          id?: string
          started_at?: string | null
          task_id?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          duration?: number
          id?: string
          started_at?: string | null
          task_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      stat_visibility: {
        Row: {
          created_at: string
          id: string
          stat_field: string
          updated_at: string
          user_id: string
          visible_to_friends: boolean | null
        }
        Insert: {
          created_at?: string
          id?: string
          stat_field: string
          updated_at?: string
          user_id: string
          visible_to_friends?: boolean | null
        }
        Update: {
          created_at?: string
          id?: string
          stat_field?: string
          updated_at?: string
          user_id?: string
          visible_to_friends?: boolean | null
        }
        Relationships: []
      }
      stats: {
        Row: {
          completed_tasks: number | null
          created_at: string
          id: string
          last_active_date: string | null
          longest_streak: number | null
          streak: number | null
          tasks_completed_today: number | null
          total_focus_time: number | null
          total_sessions: number | null
          total_tasks: number | null
          updated_at: string
          user_id: string
          version: number | null
        }
        Insert: {
          completed_tasks?: number | null
          created_at?: string
          id?: string
          last_active_date?: string | null
          longest_streak?: number | null
          streak?: number | null
          tasks_completed_today?: number | null
          total_focus_time?: number | null
          total_sessions?: number | null
          total_tasks?: number | null
          updated_at?: string
          user_id: string
          version?: number | null
        }
        Update: {
          completed_tasks?: number | null
          created_at?: string
          id?: string
          last_active_date?: string | null
          longest_streak?: number | null
          streak?: number | null
          tasks_completed_today?: number | null
          total_focus_time?: number | null
          total_sessions?: number | null
          total_tasks?: number | null
          updated_at?: string
          user_id?: string
          version?: number | null
        }
        Relationships: []
      }
      subtasks: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          id: string
          task_id: string
          title: string
          updated_at: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          task_id: string
          title: string
          updated_at?: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          task_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          due_date: string | null
          end_time: string | null
          estimated_duration: number | null
          failed_at: string | null
          id: string
          is_overdue: boolean | null
          is_recurring: boolean | null
          notes: string | null
          order: number | null
          parent_recurring_task_id: string | null
          pomodoro_count: number | null
          postponed_to: string | null
          priority: string | null
          recurrence_days_of_week: number[] | null
          recurrence_end_date: string | null
          recurrence_interval: number | null
          recurrence_pattern: string | null
          start_date: string | null
          start_time: string | null
          sub_domain: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          version: number | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          end_time?: string | null
          estimated_duration?: number | null
          failed_at?: string | null
          id?: string
          is_overdue?: boolean | null
          is_recurring?: boolean | null
          notes?: string | null
          order?: number | null
          parent_recurring_task_id?: string | null
          pomodoro_count?: number | null
          postponed_to?: string | null
          priority?: string | null
          recurrence_days_of_week?: number[] | null
          recurrence_end_date?: string | null
          recurrence_interval?: number | null
          recurrence_pattern?: string | null
          start_date?: string | null
          start_time?: string | null
          sub_domain?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          version?: number | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          end_time?: string | null
          estimated_duration?: number | null
          failed_at?: string | null
          id?: string
          is_overdue?: boolean | null
          is_recurring?: boolean | null
          notes?: string | null
          order?: number | null
          parent_recurring_task_id?: string | null
          pomodoro_count?: number | null
          postponed_to?: string | null
          priority?: string | null
          recurrence_days_of_week?: number[] | null
          recurrence_end_date?: string | null
          recurrence_interval?: number | null
          recurrence_pattern?: string | null
          start_date?: string | null
          start_time?: string | null
          sub_domain?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_parent_recurring_task_id_fkey"
            columns: ["parent_recurring_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          break_time_default: number | null
          daily_goal: number | null
          email_notifications: boolean | null
          focus_time_default: number | null
          language: string | null
          notifications_enabled: boolean | null
          sound_enabled: boolean | null
          theme: string | null
          theme_preference: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          break_time_default?: number | null
          daily_goal?: number | null
          email_notifications?: boolean | null
          focus_time_default?: number | null
          language?: string | null
          notifications_enabled?: boolean | null
          sound_enabled?: boolean | null
          theme?: string | null
          theme_preference?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          break_time_default?: number | null
          daily_goal?: number | null
          email_notifications?: boolean | null
          focus_time_default?: number | null
          language?: string | null
          notifications_enabled?: boolean | null
          sound_enabled?: boolean | null
          theme?: string | null
          theme_preference?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bulk_update_task_order: {
        Args: { p_task_orders: Json; p_user_id: string }
        Returns: Json
      }
      complete_task_with_stats: {
        Args: {
          p_pomodoro_count?: number
          p_task_id: string
          p_user_id: string
        }
        Returns: Json
      }
      delete_task_with_cleanup: {
        Args: { p_task_id: string; p_user_id: string }
        Returns: Json
      }
      get_tasks_with_subtasks: {
        Args: { p_user_id: string }
        Returns: {
          completed: boolean
          completed_at: string
          created_at: string
          due_date: string
          end_time: string
          estimated_duration: number
          failed_at: string
          id: string
          is_recurring: boolean
          notes: string
          order: number
          parent_recurring_task_id: string
          pomodoro_count: number
          priority: string
          recurrence_days_of_week: number[]
          recurrence_end_date: string
          recurrence_interval: number
          recurrence_pattern: string
          start_date: string
          start_time: string
          sub_domain: string
          subtasks: Json
          tags: string[]
          title: string
          updated_at: string
          user_id: string
          version: number
        }[]
      }
      get_users_missing_profiles: {
        Args: never
        Returns: {
          user_id: string
        }[]
      }
      mark_overdue_tasks_as_failed: { Args: never; Returns: number }
      move_task_atomic: {
        Args: { p_new_position: number; p_task_id: string; p_user_id: string }
        Returns: undefined
      }
      uncomplete_task_with_stats: {
        Args: { p_task_id: string; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
