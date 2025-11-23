/**
 * @fileoverview Supabase client configuration and database type definitions.
 * Provides a singleton Supabase client instance and complete TypeScript types
 * for all database tables including tasks, sessions, stats, and more.
 * @module lib/supabase
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/** Singleton Supabase client instance */
let supabaseInstance: SupabaseClient<Database> | null = null;

/**
 * Gets or creates a Supabase client singleton instance.
 * Uses environment variables for configuration.
 *
 * @returns {SupabaseClient<Database>} Typed Supabase client
 * @throws {Error} If environment variables are not set
 */
const getSupabaseInstance = (): SupabaseClient<Database> => {
    if (!supabaseInstance) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
        }
        supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey);
    }
    return supabaseInstance;
};

/**
 * Supabase client instance for database operations.
 * Use this exported client throughout the application.
 *
 * @example
 * import { supabase } from '@/lib/supabase';
 * const { data, error } = await supabase.from('tasks').select('*');
 */
export const supabase = getSupabaseInstance();

/**
 * Complete database type definitions for Supabase.
 * Provides TypeScript types for all tables, including Row, Insert, and Update variants.
 *
 * @interface Database
 *
 * @description Tables included:
 * - tasks: User tasks with priorities, tags, and scheduling
 * - subtasks: Subtasks belonging to parent tasks
 * - stats: User productivity statistics
 * - sessions: Pomodoro session records
 * - tags: Custom user tags
 * - achievements: Unlocked achievements
 * - profiles: User profiles with avatars
 * - friends: Friend relationships
 * - stat_visibility: Privacy settings for stats
 */
export interface Database {
    public: {
        Tables: {
            tasks: {
                Row: {
                    id: string;
                    user_id: string;
                    title: string;
                    completed: boolean;
                    created_at: string;
                    updated_at: string;
                    pomodoro_count: number;
                    priority: 'high' | 'medium' | 'low' | null;
                    tags: string[] | null;
                    due_date: string | null;
                    notes: string | null;
                    order: number;
                    completed_at: string | null;
                    sub_domain: string | null;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    title: string;
                    completed?: boolean;
                    created_at?: string;
                    updated_at?: string;
                    pomodoro_count?: number;
                    priority?: 'high' | 'medium' | 'low' | null;
                    tags?: string[] | null;
                    due_date?: string | null;
                    notes?: string | null;
                    order?: number;
                    completed_at?: string | null;
                    sub_domain?: string | null;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    title?: string;
                    completed?: boolean;
                    created_at?: string;
                    updated_at?: string;
                    pomodoro_count?: number;
                    priority?: 'high' | 'medium' | 'low' | null;
                    tags?: string[] | null;
                    due_date?: string | null;
                    notes?: string | null;
                    order?: number;
                    completed_at?: string | null;
                    sub_domain?: string | null;
                };
            };
            subtasks: {
                Row: {
                    id: string;
                    task_id: string;
                    title: string;
                    completed: boolean;
                    created_at: string;
                    updated_at: string;
                    completed_at: string | null;
                };
                Insert: {
                    id?: string;
                    task_id: string;
                    title: string;
                    completed?: boolean;
                    created_at?: string;
                    updated_at?: string;
                    completed_at?: string | null;
                };
                Update: {
                    id?: string;
                    task_id?: string;
                    title?: string;
                    completed?: boolean;
                    created_at?: string;
                    updated_at?: string;
                    completed_at?: string | null;
                };
            };
            stats: {
                Row: {
                    id: string;
                    user_id: string;
                    total_sessions: number;
                    completed_tasks: number;
                    total_tasks: number;
                    streak: number;
                    total_focus_time: number;
                    longest_streak: number;
                    tasks_completed_today: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    total_sessions?: number;
                    completed_tasks?: number;
                    total_tasks?: number;
                    streak?: number;
                    total_focus_time?: number;
                    longest_streak?: number;
                    tasks_completed_today?: number;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    total_sessions?: number;
                    completed_tasks?: number;
                    total_tasks?: number;
                    streak?: number;
                    total_focus_time?: number;
                    longest_streak?: number;
                    tasks_completed_today?: number;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            sessions: {
                Row: {
                    id: string;
                    user_id: string;
                    task_id: string | null;
                    duration: number;
                    type: 'work' | 'break';
                    completed: boolean;
                    started_at: string | null;
                    completed_at: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    task_id?: string | null;
                    duration: number;
                    type: 'work' | 'break';
                    completed?: boolean;
                    started_at?: string | null;
                    completed_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    task_id?: string | null;
                    duration?: number;
                    type?: 'work' | 'break';
                    completed?: boolean;
                    started_at?: string | null;
                    completed_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            tags: {
                Row: {
                    id: string;
                    user_id: string;
                    name: string;
                    color: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    name: string;
                    color: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    name?: string;
                    color?: string;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            achievements: {
                Row: {
                    id: string;
                    user_id: string;
                    achievement_id: string;
                    unlocked_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    achievement_id: string;
                    unlocked_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    achievement_id?: string;
                    unlocked_at?: string;
                    updated_at?: string;
                };
            };
            profiles: {
                Row: {
                    id: string;
                    username: string | null;
                    avatar_url: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    username?: string | null;
                    avatar_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    username?: string | null;
                    avatar_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            friends: {
                Row: {
                    id: string;
                    sender_id: string;
                    receiver_id: string;
                    status: 'pending' | 'accepted' | 'rejected';
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    sender_id: string;
                    receiver_id: string;
                    status?: 'pending' | 'accepted' | 'rejected';
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    sender_id?: string;
                    receiver_id?: string;
                    status?: 'pending' | 'accepted' | 'rejected';
                    created_at?: string;
                    updated_at?: string;
                };
            };
            stat_visibility: {
                Row: {
                    id: string;
                    user_id: string;
                    stat_field: string;
                    visible_to_friends: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    stat_field: string;
                    visible_to_friends?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    stat_field?: string;
                    visible_to_friends?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
            };
        };
    };
}