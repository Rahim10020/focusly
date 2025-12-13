/**
 * @fileoverview Statistics page for the Focusly application.
 * Displays productivity statistics, achievements, task history, and domain breakdown
 * with tabbed navigation for different data views.
 * @module app/stats/page
 */

'use client';

import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useAchievements } from '@/lib/hooks/useAchievements';
import { useTasks } from '@/lib/hooks/useTasks';
import { TaskCategorizationService } from '@/lib/services/taskCategorizationService';
import { useState, useMemo } from 'react';

// Lazy load heavy chart components
const AchievementsList = dynamic(() => import('@/components/achievements/AchievementsList'), {
    ssr: false,
    loading: () => <div className="animate-pulse bg-muted/30 h-48 rounded-lg" />
});

const TaskHistoryList = dynamic(() => import('@/components/stats/TaskHistoryList').then(mod => ({ default: mod.TaskHistoryList })), {
    ssr: false,
    loading: () => <div className="animate-pulse bg-muted/30 h-48 rounded-lg" />
});

const DomainStats = dynamic(() => import('@/components/stats/DomainStats'), {
    ssr: false,
    loading: () => <div className="animate-pulse bg-muted/30 h-48 rounded-lg" />
});

/**
 * Statistics page component that displays comprehensive productivity data.
 * Features tabbed navigation between overview (charts, recent sessions),
 * achievements, task history, and domain statistics.
 *
 * @returns {JSX.Element} The rendered statistics page
 */
export default function StatsPage() {
    const { unlockedAchievements, lockedAchievements } = useAchievements();
    const { tasks } = useTasks();
    const [activeTab, setActiveTab] = useState<'achievements' | 'tasks' | 'domains'>('achievements');

    const categorizedTasks = useMemo(() => TaskCategorizationService.categorizeTasks(tasks), [tasks]);
    const taskStats = useMemo(() => TaskCategorizationService.calculateAccurateStats(tasks), [tasks]);

    const { completedTasks, failedTasks } = useMemo(() => {
        return {
            completedTasks: categorizedTasks.completed,
            failedTasks: categorizedTasks.failed
        };
    }, [categorizedTasks]);

    const totalVisibleTasks = tasks.length - (categorizedTasks.cancelled?.length || 0);

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
                <div>
                    <h1 className="text-4xl font-bold text-foreground mb-2">Statistics</h1>
                    <p className="text-muted-foreground">Track your productivity and progress</p>
                </div>


                {/* Tabs (Overview removed) */}
                <div className="flex gap-2 border-b border-border">
                    <button
                        onClick={() => setActiveTab('achievements')}
                        className={`px-4 py-2 cursor-pointer font-medium transition-colors relative ${activeTab === 'achievements'
                            ? 'text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Achievements
                        {activeTab === 'achievements' && (
                            <div className="absolute bottom-0 left-0 right-8 md:right-0 h-0.5 bg-primary" />
                        )}
                        <span className="ml-1 px-1 md:ml-2 md:px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                            {unlockedAchievements.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('tasks')}
                        className={`px-4 py-2 cursor-pointer font-medium transition-colors relative ${activeTab === 'tasks'
                            ? 'text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Tasks
                        {activeTab === 'tasks' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                        <span className="ml-1 px-1 md:ml-2 md:px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                            {totalVisibleTasks}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('domains')}
                        className={`px-4 py-2 cursor-pointer font-medium transition-colors relative ${activeTab === 'domains'
                            ? 'text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Domains
                        {activeTab === 'domains' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                    </button>
                </div>

                {activeTab === 'achievements' && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center  space-x-8 justify-between">
                                <CardTitle>Achievements</CardTitle>
                                <div className="text-sm text-muted-foreground">
                                    {unlockedAchievements.length} / {unlockedAchievements.length + lockedAchievements.length} unlocked
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <AchievementsList
                                unlockedAchievements={unlockedAchievements}
                                lockedAchievements={lockedAchievements}
                            />
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'tasks' && (
                    <div className="space-y-6">
                        {/* Task Statistics Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Detailed Statistics</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Completion Rate</p>
                                        <p className="text-2xl font-bold">{taskStats.completionRate.toFixed(1)}%</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Postponed</p>
                                        <p className="text-2xl font-bold">{taskStats.postponed}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Overdue</p>
                                        <p className="text-2xl font-bold text-destructive">{taskStats.overdue}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Failure Rate</p>
                                        <p className="text-2xl font-bold">{taskStats.failureRate.toFixed(1)}%</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Completed Tasks */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center space-x-8 justify-between">
                                    <CardTitle>Completed Tasks</CardTitle>
                                    <div className="text-sm text-muted-foreground">
                                        {completedTasks.length} task(s) completed
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <TaskHistoryList tasks={completedTasks} type="completed" />
                            </CardContent>
                        </Card>

                        {/* In-Progress Tasks */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center space-x-8 justify-between">
                                    <CardTitle>In-Progress Tasks</CardTitle>
                                    <div className="text-sm text-muted-foreground">
                                        {categorizedTasks.inProgress.length} in progress
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <TaskHistoryList tasks={categorizedTasks.inProgress} type="in-progress" />
                            </CardContent>
                        </Card>

                        {/* Upcoming Tasks */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center space-x-8 justify-between">
                                    <CardTitle>Upcoming Tasks</CardTitle>
                                    <div className="text-sm text-muted-foreground">
                                        {categorizedTasks.upcoming.length} upcoming
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <TaskHistoryList tasks={categorizedTasks.upcoming} type="upcoming" />
                            </CardContent>
                        </Card>

                        {/* Failed Tasks */}
                        {failedTasks.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center space-x-8 justify-between">
                                        <CardTitle>Failed Tasks</CardTitle>
                                        <div className="text-sm text-muted-foreground">
                                            {failedTasks.length} task(s) not completed
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <TaskHistoryList tasks={failedTasks} type="failed" />
                                </CardContent>
                            </Card>
                        )}

                        {/* Overdue Tasks */}
                        {categorizedTasks.overdue.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center space-x-8 justify-between">
                                        <CardTitle>Overdue Tasks</CardTitle>
                                        <div className="text-sm text-muted-foreground">
                                            {categorizedTasks.overdue.length} task(s) overdue
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <TaskHistoryList tasks={categorizedTasks.overdue} type="all" />
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {activeTab === 'domains' && (
                    <DomainStats tasks={tasks} />
                )}
            </main>
        </div>
    );
}