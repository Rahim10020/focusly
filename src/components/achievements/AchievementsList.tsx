'use client';

import { useState } from 'react';
import { Achievement } from '@/types';

interface AchievementsListProps {
    unlockedAchievements: Achievement[];
    lockedAchievements: Achievement[];
}

export default function AchievementsList({
    unlockedAchievements,
    lockedAchievements
}: AchievementsListProps) {
    const [activeTab, setActiveTab] = useState<'beginner' | 'expert'>('beginner');

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

    const unlockedFiltered = unlockedAchievements.filter(a => a.level === activeTab);
    const lockedFiltered = lockedAchievements.filter(a => a.level === activeTab);

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-muted p-1 rounded-lg">
                <button
                    onClick={() => setActiveTab('beginner')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${activeTab === 'beginner'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Débutant
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('expert')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${activeTab === 'expert'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        Expert
                    </div>
                </button>
            </div>

            {/* Content */}
            <div className="space-y-6">
                {unlockedFiltered.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                            Débloqués ({unlockedFiltered.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {unlockedFiltered.map(achievement =>
                                renderAchievement(achievement, false)
                            )}
                        </div>
                    </div>
                )}

                {lockedFiltered.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                            Verrouillés ({lockedFiltered.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {lockedFiltered.map(achievement =>
                                renderAchievement(achievement, true)
                            )}
                        </div>
                    </div>
                )}

                {unlockedFiltered.length === 0 && lockedFiltered.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        Aucun challenge disponible pour ce niveau.
                    </div>
                )}
            </div>
        </div>
    );
}