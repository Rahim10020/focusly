/**
 * @fileoverview Achievements list component displaying user progress.
 * Shows both unlocked and locked achievements with progress tracking.
 */

'use client';

import { useState } from 'react';
import { Achievement } from '@/types';
import AchievementCard from './components/AchievementCard';

/**
 * Props for the AchievementsList component.
 * @interface AchievementsListProps
 * @property {Achievement[]} unlockedAchievements - Array of achievements the user has unlocked
 * @property {Achievement[]} lockedAchievements - Array of achievements still to be unlocked
 */
interface AchievementsListProps {
    unlockedAchievements: Achievement[];
    lockedAchievements: Achievement[];
}

/**
 * Achievements list component that displays user achievements organized by level.
 * Features tabbed navigation between beginner and expert achievements,
 * with progress bars for locked achievements.
 *
 * @param {AchievementsListProps} props - Component props
 * @param {Achievement[]} props.unlockedAchievements - Achievements the user has earned
 * @param {Achievement[]} props.lockedAchievements - Achievements still in progress
 * @returns {JSX.Element} The achievements list with tabs and progress indicators
 *
 * @example
 * function AchievementsPage() {
 *   const { unlocked, locked } = useAchievements();
 *
 *   return (
 *     <AchievementsList
 *       unlockedAchievements={unlocked}
 *       lockedAchievements={locked}
 *     />
 *   );
 * }
 */
export default function AchievementsList({
    unlockedAchievements,
    lockedAchievements
}: AchievementsListProps) {
    const [activeTab, setActiveTab] = useState<'beginner' | 'expert'>('beginner');

    const unlockedFiltered = unlockedAchievements.filter(a => a.level === activeTab);
    const lockedFiltered = lockedAchievements.filter(a => a.level === activeTab);

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-muted p-1 rounded-lg">
                <button
                    onClick={() => setActiveTab('beginner')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all cursor-pointer ${activeTab === 'beginner'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Beginner
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('expert')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all cursor-pointer ${activeTab === 'expert'
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
                            Unlocked ({unlockedFiltered.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {unlockedFiltered.map(achievement => (
                                <AchievementCard
                                    key={achievement.id}
                                    achievement={achievement}
                                    isLocked={false}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {lockedFiltered.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                            To Unlock ({lockedFiltered.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {lockedFiltered.map(achievement => (
                                <AchievementCard
                                    key={achievement.id}
                                    achievement={achievement}
                                    isLocked={true}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                            Locked ({lockedFiltered.length})
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
                        No challenges available for this level.
                    </div>
                )}
            </div>
        </div>
    );
}