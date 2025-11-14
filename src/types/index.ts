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
        name: 'Santé & Performance Physique',
        description: 'Domaine "énergie du corps"',
        subDomains: {
            activité_physique: 'Activité physique (musculation, cardio, mobilité, marche)',
            nutrition: 'Nutrition (qualité des repas, régularité, hydratation)',
            sommeil: 'Sommeil (durée, régularité, récupération)',
            hygiène: 'Hygiène (soins, apparence personnelle)',
            santé_médicale: 'Santé médicale (examens, traitements, prévention)',
        },
    },
    mental_émotions_discipline: {
        name: 'Mental, Émotions & Discipline',
        description: 'Domaine "maîtrise intérieure"',
        subDomains: {
            clarté_mentale: 'Clarté mentale (journal, planification, focus)',
            gestion_émotions: 'Gestion des émotions (stress, colère, anxiété)',
            mindset_motivation: 'Mindset & motivation (confiance, attitude, résilience)',
            habitudes_quotidiennes: 'Habitudes quotidiennes (routine, constance)',
            auto_éducation_mentale: 'Auto-éducation mentale (réflexion, méditation)',
        },
    },
    compétences_carrière_finance: {
        name: 'Compétences, Carrière & Finance',
        description: 'Domaine "croissance matérielle"',
        subDomains: {
            compétences_professionnelles: 'Compétences professionnelles (tech, soft skills)',
            projets_missions: 'Projets / missions (avancement concret)',
            carrière: 'Carrière (réseau, visibilité, objectifs)',
            business_entrepreneuriat: 'Business / Entrepreneuriat (création, gestion)',
            finances_personnelles: 'Finances personnelles (gestion, épargne, investissements)',
        },
    },
    relations_communication: {
        name: 'Relations & Communication',
        description: 'Domaine "connexion humaine"',
        subDomains: {
            famille: 'Famille (temps, soutien, contact)',
            amis_vie_sociale: 'Amis / vie sociale (interactions, qualité)',
            relations_amoureuses: 'Relations amoureuses (communication, attention)',
            réseautage_opportunités: 'Réseautage & opportunités (contacts, collaborations)',
            compétences_sociales: 'Compétences sociales (assurance, écoute, empathie)',
        },
    },
    identité_valeurs_spiritualité: {
        name: 'Identité, Valeurs & Spiritualité',
        description: 'Domaine "alignement intérieur"',
        subDomains: {
            valeurs_personnelles: 'Valeurs personnelles (alignement, décisions)',
            spiritualité_réflexion: 'Spiritualité ou réflexion intérieure (prière, méditation)',
            gratitude_sens: 'Gratitude & sens (attitude)',
            vision_vie: 'Vision de vie (objectifs long terme)',
            intégrité_personnelle: 'Intégrité personnelle (cohérence entre parole et actes)',
        },
    },
    style_vie_créativité_expérience: {
        name: 'Style de vie, Créativité & Expérience',
        description: 'Domaine "qualité de vie"',
        subDomains: {
            loisirs: 'Loisirs (fun, détente)',
            créativité: 'Créativité (écriture, musique, design…)',
            voyages_découvertes: 'Voyages / découvertes (culture, expériences)',
            organisation_environnement: 'Organisation de l’environnement (maison, bureau)',
            repos_équilibre: 'Repos & équilibre (temps pour soi)',
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