'use client';

import Header from '@/components/layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import StatsOverview from '@/components/stats/StatsOverview';
import ProductivityChart from '@/components/stats/ProductivityChart';
import AchievementsList from '@/components/achievements/AchievementsList';
import TaskHistoryList from '@/components/tasks/TaskHistoryList';
import { useStats } from '@/lib/hooks/useStats';
import { useAchievements } from '@/lib/hooks/useAchievements';
import { useTasks } from '@/lib/hooks/useTasks';
import { useTags } from '@/lib/hooks/useTags';
import { formatTime } from '@/lib/utils/time';
import { useState } from 'react';

export default function StatsPage() {
    const { sessions } = useStats();
    const { unlockedAchievements, lockedAchievements } = useAchievements();
    const { tasks } = useTasks();
    const { tags } = useTags();
    const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'tasks'>('overview');

    const recentSessions = sessions
        .filter(session => session.completed)
        .slice(-10)
        .reverse();

    const completedTasks = tasks.filter(task => task.completed);
    const failedTasks = tasks.filter(task => !task.completed && task.dueDate && task.dueDate < Date.now());

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Statistics</h1>
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
                    <Card>
                        <CardHeader>
                            <div className="flex items-center space-x-8 justify-between">
                                <CardTitle>Task History</CardTitle>
                                <div className="text-sm text-muted-foreground">
                                    {completedTasks.length} completed, {failedTasks.length} failed
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <TaskHistoryList
                                completedTasks={completedTasks}
                                failedTasks={failedTasks}
                                tags={tags}
                            />
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
}