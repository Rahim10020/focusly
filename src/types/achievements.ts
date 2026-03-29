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
