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
    completed: boolean;
    createdAt: number;
    completedAt?: number;
    pomodoroCount: number;
    priority?: 'low' | 'medium' | 'high';
    tags?: string[];
    dueDate?: number;
    notes?: string;
    subTasks?: SubTask[];
    order?: number; // For drag & drop
    subDomain?: SubDomain;
}

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
    // Santé & Performance Physique
    | 'activité_physique' | 'nutrition' | 'sommeil' | 'hygiène' | 'santé_médicale'
    // Mental, Émotions & Discipline
    | 'clarté_mentale' | 'gestion_émotions' | 'mindset_motivation' | 'habitudes_quotidiennes' | 'auto_éducation_mentale'
    // Compétences, Carrière & Finance
    | 'compétences_professionnelles' | 'projets_missions' | 'carrière' | 'business_entrepreneuriat' | 'finances_personnelles'
    // Relations & Communication
    | 'famille' | 'amis_vie_sociale' | 'relations_amoureuses' | 'réseautage_opportunités' | 'compétences_sociales'
    // Identité, Valeurs & Spiritualité
    | 'valeurs_personnelles' | 'spiritualité_réflexion' | 'gratitude_sens' | 'vision_vie' | 'intégrité_personnelle'
    // Style de vie, Créativité & Expérience
    | 'loisirs' | 'créativité' | 'voyages_découvertes' | 'organisation_environnement' | 'repos_équilibre';

export type Domain =
    | 'santé_performance_physique'
    | 'mental_émotions_discipline'
    | 'compétences_carrière_finance'
    | 'relations_communication'
    | 'identité_valeurs_spiritualité'
    | 'style_vie_créativité_expérience';

export interface DomainInfo {
    name: string;
    description: string;
    subDomains: { [key in SubDomain]?: string };
}

export const DOMAINS: Record<Domain, DomainInfo> = {
    santé_performance_physique: {
        name: 'Health & Physical Performance',
        description: 'Body energy domain',
        subDomains: {
            activité_physique: 'Physical activity (weight training, cardio, mobility, walking)',
            nutrition: 'Nutrition (meal quality, regularity, hydration)',
            sommeil: 'Sleep (duration, regularity, recovery)',
            hygiène: 'Hygiene (care, personal appearance)',
            santé_médicale: 'Medical health (check-ups, treatments, prevention)',
        },
    },
    mental_émotions_discipline: {
        name: 'Mental, Emotions & Discipline',
        description: 'Inner mastery domain',
        subDomains: {
            clarté_mentale: 'Mental clarity (journaling, planning, focus)',
            gestion_émotions: 'Emotion management (stress, anger, anxiety)',
            mindset_motivation: 'Mindset & motivation (confidence, attitude, resilience)',
            habitudes_quotidiennes: 'Daily habits (routine, consistency)',
            auto_éducation_mentale: 'Mental self-education (reflection, meditation)',
        },
    },
    compétences_carrière_finance: {
        name: 'Skills, Career & Finance',
        description: 'Material growth domain',
        subDomains: {
            compétences_professionnelles: 'Professional skills (tech, soft skills)',
            projets_missions: 'Projects / missions (concrete advancement)',
            carrière: 'Career (networking, visibility, goals)',
            business_entrepreneuriat: 'Business / Entrepreneurship (creation, management)',
            finances_personnelles: 'Personal finances (management, savings, investments)',
        },
    },
    relations_communication: {
        name: 'Relationships & Communication',
        description: 'Human connection domain',
        subDomains: {
            famille: 'Family (time, support, contact)',
            amis_vie_sociale: 'Friends / social life (interactions, quality)',
            relations_amoureuses: 'Romantic relationships (communication, attention)',
            réseautage_opportunités: 'Networking & opportunities (contacts, collaborations)',
            compétences_sociales: 'Social skills (confidence, listening, empathy)',
        },
    },
    identité_valeurs_spiritualité: {
        name: 'Identity, Values & Spirituality',
        description: 'Inner alignment domain',
        subDomains: {
            valeurs_personnelles: 'Personal values (alignment, decisions)',
            spiritualité_réflexion: 'Spirituality or inner reflection (prayer, meditation)',
            gratitude_sens: 'Gratitude & meaning (attitude)',
            vision_vie: 'Life vision (long-term goals)',
            intégrité_personnelle: 'Personal integrity (consistency between words and actions)',
        },
    },
    style_vie_créativité_expérience: {
        name: 'Lifestyle, Creativity & Experience',
        description: 'Quality of life domain',
        subDomains: {
            loisirs: 'Leisure (fun, relaxation)',
            créativité: 'Creativity (writing, music, design...)',
            voyages_découvertes: 'Travel / discoveries (culture, experiences)',
            organisation_environnement: 'Environment organization (home, office)',
            repos_équilibre: 'Rest & balance (personal time)',
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