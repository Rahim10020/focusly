/**
 * @fileoverview Core type definitions for the Focusly productivity application.
 * This module defines all the main interfaces, types, and constants used throughout
 * the application for task management, Pomodoro sessions, statistics, and domain categorization.
 * @module types
 */

/**
 * Represents a subtask within a parent task.
 * Subtasks are smaller, actionable items that help break down complex tasks.
 * @interface SubTask
 */
export interface SubTask {
    /** Unique identifier for the subtask */
    id: string;
    /** Display title of the subtask */
    title: string;
    /** Whether the subtask has been completed */
    completed: boolean;
    /** Unix timestamp of when the subtask was created */
    createdAt: number;
    /** Unix timestamp of when the subtask was completed */
    completedAt?: number;
    /** Position index for drag & drop reordering */
    order?: number;
}

/**
 * Represents a task in the productivity system.
 * Tasks can have subtasks, be part of a hierarchy, and include scheduling information.
 * @interface Task
 */
export interface Task {
    /** Unique identifier for the task */
    id: string;
    /** Display title of the task */
    title: string;
    /** Whether the task is completed (kept for backward compatibility) */
    completed: boolean;
    /** Current status of the task in the workflow */
    status?: 'todo' | 'in-progress' | 'done';
    /** Unix timestamp of when the task was created */
    createdAt: number;
    /** Unix timestamp of when the task was completed */
    completedAt?: number;
    /** Unix timestamp of when the task was marked as failed (overdue) */
    failedAt?: number;
    /** Number of Pomodoro sessions completed for this task */
    pomodoroCount: number;
    /** Priority level of the task */
    priority?: 'low' | 'medium' | 'high';
    /** Array of tag IDs associated with the task */
    tags?: string[];
    /** Unix timestamp for the task due date */
    dueDate?: number;
    /** Unix timestamp for the task start date */
    startDate?: number;
    /** Start time in HH:mm format (e.g., "09:00") */
    startTime?: string;
    /** End time in HH:mm format (e.g., "17:00") */
    endTime?: string;
    /** Estimated duration to complete the task in minutes */
    estimatedDuration?: number;
    /** Additional notes or description for the task */
    notes?: string;
    /** Array of subtasks belonging to this task */
    subTasks?: SubTask[];
    /** Position index for drag & drop reordering */
    order?: number;
    /** Sub-domain category for the task */
    subDomain?: SubDomain;
    /** Version number for optimistic locking in concurrent updates */
    version?: number;

    // Hierarchical task support
    /** ID of the parent task (for nested tasks) */
    parentId?: string;
    /** Array of child tasks (loaded recursively) */
    children?: Task[];

    // Progress tracking
    /** Progress percentage (0-100), auto-calculated from subtasks completion */
    progress?: number;

    // Reminder/notification fields
    /** Unix timestamp for when to send a reminder */
    reminderTime?: number;
    /** Whether the reminder notification has been sent */
    reminderSent?: boolean;

    // Recurrence fields
    /** Whether the task repeats automatically */
    isRecurring?: boolean;
    /** Recurrence pattern: daily, weekly, monthly, or custom */
    recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'custom';
    /** Recurrence interval (e.g., every 2 days) */
    recurrenceInterval?: number;
    /** Days of the week for custom recurrence (0=Sunday, 6=Saturday) */
    recurrenceDaysOfWeek?: number[];
    /** End date for recurrence (optional) */
    recurrenceEndDate?: string;
    /** ID of the parent recurring task */
    parentRecurringTaskId?: string;

    // Metadata for UI
    /** Quick check flag indicating if task has child tasks */
    hasChildren?: boolean;
    /** Nesting level in the hierarchy (0 = root task) */
    depth?: number;
}

/**
 * Possible status values for a task in the workflow.
 * @typedef {'todo' | 'in-progress' | 'done'} TaskStatus
 */
export type TaskStatus = 'todo' | 'in-progress' | 'done';

/**
 * Represents a dependency relationship between tasks.
 * A task cannot be started until its dependencies are completed.
 * @interface TaskDependency
 */
export interface TaskDependency {
    /** Unique identifier for the dependency relationship */
    id: string;
    /** ID of the task that has the dependency */
    taskId: string;
    /** ID of the task that must be completed first */
    dependsOnTaskId: string;
    /** Unix timestamp of when the dependency was created */
    createdAt: number;
}

/**
 * Represents a scheduled time slot for a task in the calendar view.
 * Used for displaying tasks with specific start and end times.
 * @interface TimeSlot
 */
export interface TimeSlot {
    /** ID of the task occupying this time slot */
    taskId: string;
    /** Title of the task for display */
    taskTitle: string;
    /** Start date and time of the slot */
    start: Date;
    /** End date and time of the slot */
    end: Date;
    /** Priority level of the task */
    priority?: Priority;
    /** Whether the task in this slot has been completed */
    completed: boolean;
}

/**
 * Represents a calendar event for integration with calendar systems.
 * Compatible with common calendar libraries and export formats.
 * @interface CalendarEvent
 */
export interface CalendarEvent {
    /** Unique identifier for the event */
    id: string;
    /** Display title of the event */
    title: string;
    /** Start date and time */
    start: Date;
    /** End date and time */
    end: Date;
    /** Whether the event spans the entire day */
    allDay?: boolean;
    /** Reference to the original task object */
    resource?: Task;
}

/**
 * Represents a single Pomodoro session (work or break period).
 * Tracks the duration, completion status, and associated task.
 * @interface PomodoroSession
 */
export interface PomodoroSession {
    /** Unique identifier for the session */
    id: string;
    /** Type of session (work or break) */
    type: 'work' | 'break';
    /** Duration of the session in seconds */
    duration: number;
    /** Whether the session was completed (not skipped) */
    completed: boolean;
    /** ID of the task associated with this session */
    taskId?: string;
    /** Unix timestamp of when the session started */
    startedAt: number;
    /** Unix timestamp of when the session completed */
    completedAt?: number;
}

/**
 * Aggregate statistics for user productivity tracking.
 * Provides overview metrics for dashboards and reports.
 * @interface Stats
 */
export interface Stats {
    /** Total time spent in focus sessions (in minutes) */
    totalFocusTime: number;
    /** Total number of tasks created */
    totalTasks: number;
    /** Number of tasks marked as completed */
    completedTasks: number;
    /** Total number of Pomodoro sessions completed */
    totalSessions: number;
    /** Current consecutive days with activity */
    streak: number;
    /** Longest streak achieved */
    longestStreak?: number;
    /** Number of tasks completed today */
    tasksCompletedToday?: number;
}

/**
 * Represents a gamification achievement that users can unlock.
 * Achievements motivate users through recognition of milestones.
 * @interface Achievement
 */
export interface Achievement {
    /** Unique identifier for the achievement */
    id: string;
    /** Display title of the achievement */
    title: string;
    /** Description of how to earn the achievement */
    description: string;
    /** Emoji or icon identifier for display */
    icon: string;
    /** Difficulty level of the achievement */
    level: 'beginner' | 'expert';
    /** Unix timestamp of when the achievement was unlocked */
    unlockedAt?: number;
    /** Current progress towards the achievement (0-target) */
    progress?: number;
    /** Target value required to unlock the achievement */
    target?: number;
}

/**
 * Represents a tag for categorizing and filtering tasks.
 * Tags can have custom colors for visual distinction.
 * @interface Tag
 */
export interface Tag {
    /** Unique identifier for the tag */
    id: string;
    /** Display name of the tag */
    name: string;
    /** Hex color code for the tag (e.g., "#FF5733") */
    color: string;
    /** Unix timestamp of when the tag was created */
    createdAt: number;
}

/**
 * Defines a keyboard shortcut configuration.
 * Used for registering and handling keyboard shortcuts in the application.
 * @interface KeyboardShortcut
 */
export interface KeyboardShortcut {
    /** The key to press (e.g., "Space", "Enter", "k") */
    key: string;
    /** Whether Ctrl key must be held */
    ctrlKey?: boolean;
    /** Whether Shift key must be held */
    shiftKey?: boolean;
    /** Whether Alt key must be held */
    altKey?: boolean;
    /** Whether Meta/Command key must be held */
    metaKey?: boolean;
    /** Human-readable description of the shortcut action */
    description: string;
    /** Function to execute when the shortcut is triggered */
    action: () => void;
}

/**
 * Possible states of the Pomodoro timer.
 * @typedef {'idle' | 'running' | 'paused'} TimerStatus
 */
export type TimerStatus = 'idle' | 'running' | 'paused';

/**
 * Application theme options.
 * @typedef {'light' | 'dark'} Theme
 */
export type Theme = 'light' | 'dark';

/**
 * Task priority levels for sorting and visual indication.
 * @typedef {'low' | 'medium' | 'high'} Priority
 */
export type Priority = 'low' | 'medium' | 'high';

/**
 * Sub-domain categories for detailed task classification.
 * Sub-domains are grouped under main domains for comprehensive life management.
 *
 * @typedef SubDomain
 *
 * @description Categories are organized as follows:
 * - **Health (Physical & Mental)**: sport_activity, nutrition, hydration, sleep, hygiene, stress_management, emotion_management, meditation_breathing
 * - **Career & Skills**: work_productivity, technical_skills, general_skills, online_training, reading_learning, professional_projects, professional_networking
 * - **Finance & Business**: budget, savings, investments, controlled_expenses, income_side_hustle, marketing, business_management
 * - **Relationships & Social Life**: family, friends, romantic_relationship, networking, communication, conflicts_resolution, social_moments
 * - **Personal Development & Lifestyle**: goals, habits, discipline, morning_evening_routine, self_confidence, home_organization, creativity_leisure, life_vision
 */
export type SubDomain =
    // Health (Physical & Mental)
    | 'sport_activity' | 'nutrition' | 'hydration' | 'sleep' | 'hygiene' | 'stress_management' | 'emotion_management' | 'meditation_breathing'
    // Career & Skills
    | 'work_productivity' | 'technical_skills' | 'general_skills' | 'online_training' | 'reading_learning' | 'professional_projects' | 'professional_networking'
    // Finance & Business
    | 'budget' | 'savings' | 'investments' | 'controlled_expenses' | 'income_side_hustle' | 'marketing' | 'business_management'
    // Relationships & Social Life
    | 'family' | 'friends' | 'romantic_relationship' | 'networking' | 'communication' | 'conflicts_resolution' | 'social_moments'
    // Personal Development & Lifestyle
    | 'goals' | 'habits' | 'discipline' | 'morning_evening_routine' | 'self_confidence' | 'home_organization' | 'creativity_leisure' | 'life_vision';

/**
 * Main life domain categories for high-level task organization.
 * Each domain contains multiple sub-domains for detailed categorization.
 * @typedef Domain
 */
export type Domain =
    | 'health_physical_mental'
    | 'career_skills'
    | 'finance_business'
    | 'relationships_social_life'
    | 'personal_development_lifestyle';

/**
 * Information about a domain including its display name, description, and sub-domains.
 * Used for rendering domain selectors and organizing tasks.
 * @interface DomainInfo
 */
export interface DomainInfo {
    /** Human-readable display name for the domain */
    name: string;
    /** Brief description of what the domain covers */
    description: string;
    /** Map of sub-domain keys to their display names */
    subDomains: { [key in SubDomain]?: string };
}

/**
 * Complete mapping of all domains to their information.
 * This constant defines the entire domain hierarchy with names, descriptions, and sub-domains.
 * @constant
 * @type {Record<Domain, DomainInfo>}
 */
export const DOMAINS: Record<Domain, DomainInfo> = {
    health_physical_mental: {
        name: 'Health (Physical & Mental)',
        description: 'Physical and mental well-being',
        subDomains: {
            sport_activity: 'Sport / activity',
            nutrition: 'Nutrition',
            hydration: 'Hydration',
            sleep: 'Sleep',
            hygiene: 'Hygiene',
            stress_management: 'Stress management',
            emotion_management: 'Emotion management',
            meditation_breathing: 'Meditation / breathing',
        },
    },
    career_skills: {
        name: 'Career & Skills',
        description: 'Professional growth and development',
        subDomains: {
            work_productivity: 'Work productivity',
            technical_skills: 'Technical skills (coding, design, etc.)',
            general_skills: 'General skills (communication, leadership...)',
            online_training: 'Online courses / training',
            reading_learning: 'Reading / learning',
            professional_projects: 'Professional projects',
            professional_networking: 'Professional networking',
        },
    },
    finance_business: {
        name: 'Finance & Business',
        description: 'Financial management and entrepreneurship',
        subDomains: {
            budget: 'Budget',
            savings: 'Savings',
            investments: 'Investments',
            controlled_expenses: 'Controlled expenses',
            income_side_hustle: 'Income / side hustle',
            marketing: 'Marketing (if entrepreneur)',
            business_management: 'Business management / organization',
        },
    },
    relationships_social_life: {
        name: 'Relationships & Social Life',
        description: 'Social connections and relationships',
        subDomains: {
            family: 'Family',
            friends: 'Friends',
            romantic_relationship: 'Romantic relationship',
            networking: 'Networking',
            communication: 'Communication',
            conflicts_resolution: 'Conflicts / resolution',
            social_moments: 'Social moments',
        },
    },
    personal_development_lifestyle: {
        name: 'Personal Development & Lifestyle',
        description: 'Self-improvement and life balance',
        subDomains: {
            goals: 'Goals',
            habits: 'Habits',
            discipline: 'Discipline',
            morning_evening_routine: 'Morning / evening routine',
            self_confidence: 'Self-confidence',
            home_organization: 'Home / organization',
            creativity_leisure: 'Creativity / leisure',
            life_vision: 'Life vision / introspection',
        },
    },
};

/**
 * Retrieves the parent domain for a given sub-domain.
 * Useful for grouping tasks by their main category.
 *
 * @param {SubDomain} subDomain - The sub-domain to look up
 * @returns {Domain} The parent domain containing the sub-domain
 * @throws {Error} If the sub-domain is not found in any domain
 *
 * @example
 * const domain = getDomainFromSubDomain('nutrition');
 * // Returns: 'health_physical_mental'
 */
export const getDomainFromSubDomain = (subDomain: SubDomain): Domain => {
    for (const [domain, info] of Object.entries(DOMAINS)) {
        if (info.subDomains[subDomain]) {
            return domain as Domain;
        }
    }
    throw new Error(`Unknown subdomain: ${subDomain}`);
};