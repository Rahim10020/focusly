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
import { useStats } from '@/lib/hooks/useStats';
import { useStatsWithTimezone } from '@/lib/hooks/useStatsWithTimezone';
import { useCachedSessions } from '@/lib/hooks/useCachedSessions';
import { useAchievements } from '@/lib/hooks/useAchievements';
import { useTasks } from '@/lib/hooks/useTasks';
import { useTags } from '@/lib/hooks/useTags';
import { formatTime } from '@/lib/utils/time';
import { TaskCategorizationService } from '@/lib/services/taskCategorizationService';
import { useState, useMemo } from 'react';

// Lazy load heavy chart components
const StatsOverview = dynamic(() => import('@/components/stats/StatsOverview'), {
    ssr: false,
    loading: () => <div className="animate-pulse bg-muted/30 h-32 rounded-lg" />
});

const ProductivityChart = dynamic(() => import('@/components/stats/ProductivityChart'), {
    ssr: false,
    loading: () => <div className="animate-pulse bg-muted/30 h-64 rounded-lg" />
});

const AchievementsList = dynamic(() => import('@/components/achievements/AchievementsList'), {
    ssr: false,
    loading: () => <div className="animate-pulse bg-muted/30 h-48 rounded-lg" />
});

const TaskHistoryList = dynamic(() => import('@/components/stats/TaskHistoryList'), {
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
    const { sessions } = useStats();
    const { stats, loading: statsLoading } = useStatsWithTimezone();
    const { sessions: cachedSessions, loading: sessionsLoading } = useCachedSessions(30);
    const { unlockedAchievements, lockedAchievements } = useAchievements();
    const { tasks, loading: tasksLoading } = useTasks();
    const { tags } = useTags();
    const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'tasks' | 'domains'>('overview');

    const recentSessions = useMemo(
        () =>
            sessions
                .filter(session => session.completed)
                .slice(-10)
                .reverse(),
        [sessions]
    );

    const categorizedTasks = useMemo(() => TaskCategorizationService.categorizeTasks(tasks), [tasks]);
    const taskStats = useMemo(() => TaskCategorizationService.calculateAccurateStats(tasks), [tasks]);

    const { completedTasks, failedTasks } = useMemo(() => {
        return {
            completedTasks: categorizedTasks.completed,
            failedTasks: categorizedTasks.failed
        };
    }, [categorizedTasks]);

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
                <div>
                    <h1 className="text-4xl font-bold text-foreground mb-2">Statistics</h1>
                    <p className="text-muted-foreground">Track your productivity and progress</p>
                </div>

                <StatsOverview />

                {/* Tabs */}
                <div className="flex gap-2 border-b border-border">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 cursor-pointer font-medium transition-colors relative ${activeTab === 'overview'
                            ? 'text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Overview
                        {activeTab === 'overview' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                    </button>
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
                            {completedTasks.length + failedTasks.length}
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

                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Productivity Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Weekly Activity</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ProductivityChart sessions={sessions} />
                            </CardContent>
                        </Card>

                        {/* Recent Sessions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Sessions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {recentSessions.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <p>No completed sessions yet. Start a Pomodoro timer to track your progress!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {recentSessions.map((session) => (
                                            <div
                                                key={session.id}
                                                className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${session.type === 'work' ? 'bg-primary' : 'bg-accent'
                                                        }`} />
                                                    <div>
                                                        <p className="text-sm font-medium text-foreground">
                                                            {session.type === 'work' ? 'Focus Session' : 'Break'}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(session.startedAt).toLocaleDateString()} at{' '}
                                                            {new Date(session.startedAt).toLocaleTimeString([], {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-sm font-medium text-foreground">
                                                    {formatTime(session.duration)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

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
                                <CardTitle>Statistiques Détaillées</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Taux de complétion</p>
                                        <p className="text-2xl font-bold">{taskStats.completionRate.toFixed(1)}%</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Tâches reportées</p>
                                        <p className="text-2xl font-bold">{taskStats.postponed}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Tâches en retard</p>
                                        <p className="text-2xl font-bold text-destructive">{taskStats.overdue}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Taux d&apos;échec</p>
                                        <p className="text-2xl font-bold">{taskStats.failureRate.toFixed(1)}%</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Completed Tasks */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center space-x-8 justify-between">
                                    <CardTitle>Tâches Complétées</CardTitle>
                                    <div className="text-sm text-muted-foreground">
                                        {completedTasks.length} tâche(s) terminée(s)
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <TaskHistoryList tasks={completedTasks} type="completed" />
                            </CardContent>
                        </Card>

                        {/* Failed Tasks */}
                        {failedTasks.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center space-x-8 justify-between">
                                        <CardTitle>Tâches Échouées</CardTitle>
                                        <div className="text-sm text-muted-foreground">
                                            {failedTasks.length} tâche(s) non terminée(s)
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
                                        <CardTitle>Tâches en Retard</CardTitle>
                                        <div className="text-sm text-muted-foreground">
                                            {categorizedTasks.overdue.length} tâche(s) en retard
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