import { startOfWeek, endOfWeek } from 'date-fns';

export interface Insight {
    type: 'positive' | 'warning' | 'info' | 'achievement';
    title: string;
    message: string;
    icon: string;
    suggestion?: string;
}

interface Stats {
    totalFocusTime: number;
    totalTasks: number;
    completedTasks: number;
    totalSessions: number;
    streak: number;
    longestStreak?: number;
}

interface Session {
    started_at: string;
    duration: number;
}

interface Task {
    id: string;
    status: string;
    sub_domain?: string;
    completed_at?: string;
}

const getWeekFocusTime = (sessions: Session[], weeksAgo: number): number => {
    const now = new Date();
    const targetWeekStart = new Date(now);
    targetWeekStart.setDate(now.getDate() - (weeksAgo * 7));

    const weekStart = startOfWeek(targetWeekStart);
    const weekEnd = endOfWeek(targetWeekStart);

    return sessions
        .filter(s => {
            const sessionDate = new Date(s.started_at);
            return sessionDate >= weekStart && sessionDate <= weekEnd;
        })
        .reduce((sum, s) => sum + s.duration, 0);
};

const analyzeProductivityByHour = (sessions: Session[]) => {
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        focusTime: 0,
        sessions: 0
    }));

    sessions.forEach(session => {
        const hour = new Date(session.started_at).getHours();
        hourlyData[hour].focusTime += session.duration;
        hourlyData[hour].sessions += 1;
    });

    return hourlyData;
};

const analyzeDomainDistribution = (tasks: Task[]) => {
    const domains = tasks.reduce((acc, task) => {
        const domain = task.sub_domain || 'Sans domaine';
        acc[domain] = (acc[domain] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const total = tasks.length;
    return Object.entries(domains).map(([name, count]) => ({
        name,
        count,
        percentage: (count / total) * 100
    }));
};

export const generateDynamicInsights = (
    stats: Stats,
    sessions: Session[],
    tasks: Task[]
): Insight[] => {
    const insights: Insight[] = [];

    // Insight 1: Tendance de productivité
    const thisWeekFocus = getWeekFocusTime(sessions, 0);
    const lastWeekFocus = getWeekFocusTime(sessions, 1);

    if (lastWeekFocus > 0) {
        const percentChange = ((thisWeekFocus - lastWeekFocus) / lastWeekFocus) * 100;

        if (percentChange > 10) {
            insights.push({
                type: 'positive',
                title: 'Excellent progrès!',
                message: `Votre temps de focus a augmenté de ${percentChange.toFixed(1)}% cette semaine`,
                icon: '📈'
            });
        } else if (percentChange < -10) {
            insights.push({
                type: 'warning',
                title: 'Attention',
                message: `Votre temps de focus a diminué de ${Math.abs(percentChange).toFixed(1)}% cette semaine`,
                icon: '⚠️',
                suggestion: 'Essayez de planifier des sessions plus régulières'
            });
        }
    }

    // Insight 2: Meilleur moment de productivité
    if (sessions.length > 0) {
        const hourlyProductivity = analyzeProductivityByHour(sessions);
        const bestHour = hourlyProductivity.reduce((max, curr) =>
            curr.focusTime > max.focusTime ? curr : max
        );

        if (bestHour.focusTime > 0) {
            insights.push({
                type: 'info',
                title: 'Votre pic de productivité',
                message: `Vous êtes plus productif vers ${bestHour.hour}h`,
                icon: '⏰',
                suggestion: 'Planifiez vos tâches importantes à cette heure'
            });
        }
    }

    // Insight 3: Streak analysis
    if (stats.streak >= 7) {
        insights.push({
            type: 'achievement',
            title: 'Streak impressionnant!',
            message: `${stats.streak} jours consécutifs! Continuez!`,
            icon: '🔥'
        });
    } else if (stats.streak === 0 && stats.longestStreak && stats.longestStreak > 0) {
        insights.push({
            type: 'warning',
            title: 'Streak perdu',
            message: `Votre plus long streak était de ${stats.longestStreak} jours`,
            icon: '💔',
            suggestion: "Commencez un nouveau streak aujourd'hui!"
        });
    }

    // Insight 4: Domaine négligé
    if (tasks.length > 0) {
        const domainStats = analyzeDomainDistribution(tasks);
        const neglectedDomain = domainStats.find(d => d.percentage < 10 && d.count > 0);

        if (neglectedDomain && domainStats.length > 1) {
            insights.push({
                type: 'info',
                title: 'Domaine négligé',
                message: `Seulement ${neglectedDomain.percentage.toFixed(1)}% de vos tâches concernent ${neglectedDomain.name}`,
                icon: '⚖️',
                suggestion: 'Pensez à équilibrer vos domaines de vie'
            });
        }
    }

    // Insight 5: Taux de complétion
    if (stats.totalTasks > 0) {
        const completionRate = (stats.completedTasks / stats.totalTasks) * 100;

        if (completionRate > 80) {
            insights.push({
                type: 'positive',
                title: 'Taux de complétion excellent',
                message: `Vous complétez ${completionRate.toFixed(1)}% de vos tâches`,
                icon: '🎯'
            });
        } else if (completionRate < 50) {
            insights.push({
                type: 'warning',
                title: 'Taux de complétion faible',
                message: `Seulement ${completionRate.toFixed(1)}% de vos tâches sont complétées`,
                icon: '📉',
                suggestion: 'Définissez des objectifs plus réalistes ou réduisez le nombre de tâches'
            });
        }
    }

    return insights;
};
