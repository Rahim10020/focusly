'use client';

import { Achievement } from '@/types';

interface AchievementsListProps {
    unlockedAchievements: Achievement[];
    lockedAchievements: Achievement[];
}

export default function AchievementsList({
    unlockedAchievements,
    lockedAchievements
}: AchievementsListProps) {
    const renderAchievement = (achievement: Achievement, isLocked: boolean) => {
        const progress = achievement.progress || 0;
        const target = achievement.target || 1;
        const percentage = Math.min((progress / target) * 100, 100);

        return (
            <div
                key={achievement.id}
                className={`p-4 rounded-xl border-2 transition-all ${isLocked
                    ? 'bg-muted/50 border-border opacity-60'
                    : 'bg-primary/10 border-primary shadow-sm'
                    }`}
            >
                <div className="flex items-start gap-3">
                    <div className={`text-4xl ${isLocked ? 'grayscale' : ''}`}>
                        {achievement.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground mb-1">
                            {achievement.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                            {achievement.description}
                        </p>

                        {isLocked && achievement.target && (
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Progress</span>
                                    <span>{progress} / {target}</span>
                                </div>
                                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all duration-300"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {!isLocked && achievement.unlockedAt && (
                            <p className="text-xs text-primary font-medium">
                                Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const unlockedBeginner = unlockedAchievements.filter(a => a.level === 'beginner');
    const unlockedExpert = unlockedAchievements.filter(a => a.level === 'expert');
    const lockedBeginner = lockedAchievements.filter(a => a.level === 'beginner');
    const lockedExpert = lockedAchievements.filter(a => a.level === 'expert');

    return (
        <div className="space-y-8">
            {/* Beginner Level */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <h2 className="text-lg font-semibold text-foreground">Beginner Challenges</h2>
                </div>

                {unlockedBeginner.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                            Unlocked ({unlockedBeginner.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {unlockedBeginner.map(achievement =>
                                renderAchievement(achievement, false)
                            )}
                        </div>
                    </div>
                )}

                {lockedBeginner.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                            Locked ({lockedBeginner.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {lockedBeginner.map(achievement =>
                                renderAchievement(achievement, true)
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Expert Level */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <h2 className="text-lg font-semibold text-foreground">Expert Challenges</h2>
                </div>

                {unlockedExpert.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                            Unlocked ({unlockedExpert.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {unlockedExpert.map(achievement =>
                                renderAchievement(achievement, false)
                            )}
                        </div>
                    </div>
                )}

                {lockedExpert.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                            Locked ({lockedExpert.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {lockedExpert.map(achievement =>
                                renderAchievement(achievement, true)
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}