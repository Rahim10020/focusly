/**
 * @fileoverview Supabase database type definitions.
 * Auto-generated types for all database tables.
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
                    start_date: string | null;
                    notes: string | null;
                    order: number;
                    completed_at: string | null;
                    sub_domain: string | null;
                    start_time: string | null;
                    end_time: string | null;
                    estimated_duration: number | null;
                    reminder: string | null;
                    version: number;
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
                    start_date?: string | null;
                    notes?: string | null;
                    order?: number;
                    completed_at?: string | null;
                    sub_domain?: string | null;
                    start_time?: string | null;
                    end_time?: string | null;
                    estimated_duration?: number | null;
                    reminder?: string | null;
                    version?: number;
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
                    start_date?: string | null;
                    notes?: string | null;
                    order?: number;
                    completed_at?: string | null;
                    sub_domain?: string | null;
                    start_time?: string | null;
                    end_time?: string | null;
                    estimated_duration?: number | null;
                    reminder?: string | null;
                    version?: number;
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
            notifications: {
                Row: {
                    id: string;
                    user_id: string;
                    type: 'friend_request' | 'friend_request_accepted' | 'task_completed' | 'task_overdue' | 'achievement' | 'info';
                    title: string;
                    message: string;
                    data: any | null;
                    read: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    type: 'friend_request' | 'friend_request_accepted' | 'task_completed' | 'task_overdue' | 'achievement' | 'info';
                    title: string;
                    message: string;
                    data?: any | null;
                    read?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    type?: 'friend_request' | 'friend_request_accepted' | 'task_completed' | 'task_overdue' | 'achievement' | 'info';
                    title?: string;
                    message?: string;
                    data?: any | null;
                    read?: boolean;
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
