export type TaskStatus = 'todo' | 'in-progress' | 'done' | 'postponed' | 'cancelled';
export type Priority = 'low' | 'medium' | 'high';
export type SubDomain =
  | 'education' | 'professional' | 'financial'
  | 'household' | 'health-fitness' | 'family-relationships'
  | 'personal-growth' | 'spiritual' | 'hobbies-leisure' | 'social';
export type Domain = 'career' | 'personal-life' | 'self-improvement';

export interface SubTask {
    id: string;
    title: string;
    completed: boolean;
    createdAt: number;
    completedAt?: number;
    order?: number;
}

export interface Task {
    id: string;
    title: string;
    completed: boolean;
    status?: TaskStatus;
    createdAt: number;
    completedAt?: number;
    failedAt?: number;
    pomodoroCount: number;
    priority?: Priority;
    tags?: string[];
    dueDate?: number;
    startDate?: number;
    startTime?: string;
    endTime?: string;
    estimatedDuration?: number;
    notes?: string;
    subTasks?: SubTask[];
    order?: number;
    subDomain?: SubDomain;
    version?: number;
    parentId?: string;
    children?: Task[];
    progress?: number;
    reminderTime?: number;
    reminderSent?: boolean;
    isRecurring?: boolean;
    recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'custom';
    recurrenceInterval?: number;
    recurrenceDaysOfWeek?: number[];
    recurrenceEndDate?: string;
    parentRecurringTaskId?: string;
    hasChildren?: boolean;
    depth?: number;
}

export interface Tag {
    id: string;
    name: string;
    color: string;
    createdAt: number;
}

export interface DomainInfo {
    id: Domain;
    name: string;
    icon: string;
    color: string;
    subDomains: {
        id: SubDomain;
        name: string;
    }[];
}
