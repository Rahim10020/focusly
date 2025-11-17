export interface SubTask {
    id: string;
    title: string;
    completed: boolean;
    createdAt: number;
    completedAt?: number;
}

export interface Task {
    id: string;
    title: string;
    completed: boolean; // Keep for backward compatibility
    status?: 'todo' | 'in-progress' | 'done'; // New status field
    createdAt: number;
    completedAt?: number;
    pomodoroCount: number;
    priority?: 'low' | 'medium' | 'high';
    tags?: string[];
    dueDate?: number; // Due date timestamp
    startDate?: number; // Start date timestamp
    startTime?: string; // Start time (HH:mm format)
    endTime?: string; // End time (HH:mm format)
    estimatedDuration?: number; // Estimated duration in minutes
    notes?: string;
    subTasks?: SubTask[];
    order?: number; // For drag & drop
    subDomain?: SubDomain;
    version?: number; // For optimistic locking
}

export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface PomodoroSession {
    id: string;
    type: 'work' | 'break';
    duration: number;
    completed: boolean;
    taskId?: string;
    startedAt: number;
    completedAt?: number;
}

export interface Stats {
    totalFocusTime: number;
    totalTasks: number;
    completedTasks: number;
    totalSessions: number;
    streak: number;
    longestStreak?: number;
    tasksCompletedToday?: number;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    level: 'beginner' | 'expert';
    unlockedAt?: number;
    progress?: number;
    target?: number;
}

export interface Tag {
    id: string;
    name: string;
    color: string;
    createdAt: number;
}

export interface KeyboardShortcut {
    key: string;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
    description: string;
    action: () => void;
}

export type TimerStatus = 'idle' | 'running' | 'paused';

export type Theme = 'light' | 'dark';

export type Priority = 'low' | 'medium' | 'high';

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

export type Domain =
    | 'health_physical_mental'
    | 'career_skills'
    | 'finance_business'
    | 'relationships_social_life'
    | 'personal_development_lifestyle';

export interface DomainInfo {
    name: string;
    description: string;
    subDomains: { [key in SubDomain]?: string };
}

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

export const getDomainFromSubDomain = (subDomain: SubDomain): Domain => {
    for (const [domain, info] of Object.entries(DOMAINS)) {
        if (info.subDomains[subDomain]) {
            return domain as Domain;
        }
    }
    throw new Error(`Unknown subdomain: ${subDomain}`);
};