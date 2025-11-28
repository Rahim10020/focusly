/**
 * @fileoverview Analytics Dashboard page for the Focusly application.
 * Displays comprehensive productivity analytics, charts, and export functionality
 * for tasks, sessions, and domain progress data.
 * @module app/dashboard/page
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '@/components/layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import AdvancedProductivityChart from '@/components/stats/AdvancedProductivityChart';
import DomainEvolutionChart from '@/components/stats/DomainEvolutionChart';
import { useTasks } from '@/lib/hooks/useTasks';
import { useStats } from '@/lib/hooks/useStats';
import { exportTasksToPDF, exportAnalyticsToPDF, exportTasksToCSV, exportAnalyticsToCSV } from '@/lib/utils/exportUtils';
import { exportTasksToICS } from '@/lib/utils/calendarIntegration';

/**
 * Dashboard page component that displays comprehensive analytics and productivity insights.
 * Features include productivity charts, quick stats, domain evolution tracking,
 * and export functionality for tasks and analytics data.
 *
 * @returns {JSX.Element | null} The rendered dashboard page or null during redirect
 */
export default function DashboardPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const { tasks } = useTasks();
    const { sessions, stats } = useStats();
    const [timeRange, setTimeRange] = useState<7 | 30>(7);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.replace('/auth/signin');
        }
    }, [status, router]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return null;
    }

    const completedTasks = tasks.filter(t => t.completed).length;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Page Header */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Analytics Dashboard</h1>
                        <p className="text-muted-foreground">
                            Comprehensive overview of your productivity and progress
                        </p>
                    </div>
                </div>
                {/* Export Buttons */}
                <div className="flex flex-wrap gap-2 mb-4">
                    <Button
                        variant="outline"
                        onClick={() => exportTasksToCSV(tasks)}
                        className="text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Export Tasks (CSV)
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => exportTasksToPDF(tasks, session?.user?.name || 'User')}
                        className="text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                        Export Tasks (PDF)
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => exportAnalyticsToCSV(stats || {
                            totalFocusTime: 0,
                            totalTasks,
                            completedTasks,
                            totalSessions: 0,
                            streak: 0,
                        }, tasks, sessions)}
                        className="text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                            <line x1="12" y1="1" x2="12" y2="23"></line>
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
                        Analytics (CSV)
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => exportAnalyticsToPDF(
                            stats || {
                                totalFocusTime: 0,
                                totalTasks,
                                completedTasks,
                                totalSessions: 0,
                                streak: 0,
                            },
                            tasks,
                            sessions,
                            session?.user?.name || 'User'
                        )}
                        className="text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                            <line x1="12" y1="1" x2="12" y2="23"></line>
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
                        Analytics (PDF)
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => exportTasksToICS(tasks)}
                        className="text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        Export Calendar (iCal)
                    </Button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card variant="elevated">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Total Tasks</p>
                                    <p className="text-3xl font-bold">{totalTasks}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                                    </svg>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card variant="elevated">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Completed</p>
                                    <p className="text-3xl font-bold">{completedTasks}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card variant="elevated">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Completion Rate</p>
                                    <p className="text-3xl font-bold">{completionRate}%</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card variant="elevated">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Current Streak</p>
                                    <p className="text-3xl font-bold">{stats?.streak || 0}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                                        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
                                    </svg>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Time Range Selector */}
                <div className="flex justify-end mb-6">
                    <div className="flex gap-2 bg-muted p-1 rounded-lg">
                        <Button
                            variant={timeRange === 7 ? 'primary' : 'ghost'}
                            onClick={() => setTimeRange(7)}
                            className="text-sm"
                        >
                            Last 7 Days
                        </Button>
                        <Button
                            variant={timeRange === 30 ? 'primary' : 'ghost'}
                            onClick={() => setTimeRange(30)}
                            className="text-sm"
                        >
                            Last 30 Days
                        </Button>
                    </div>
                </div>

                {/* Productivity Charts */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">Productivity Trends</h2>
                    <AdvancedProductivityChart sessions={sessions} days={timeRange} />
                </div>

                {/* Domain Evolution */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">Life Domains Progress</h2>
                    <DomainEvolutionChart tasks={tasks} />
                </div>

                {/* Insights Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Productivity Insights (Beta)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Most Productive Day */}
                            <div className="p-4 bg-muted rounded-lg">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        {/* ...existing icon... */}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">Peak Performance</h3>
                                        <p className="text-sm text-muted-foreground">
                                            You're most productive during morning sessions. In future updates, this tip will adapt based on your actual focus history.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Completion Trend */}
                            <div className="p-4 bg-muted rounded-lg">
                                {/* ...existing Great Progress block (unchanged)... */}
                            </div>

                            {/* Recommendation */}
                            <div className="p-4 bg-muted rounded-lg">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                                        {/* ...existing icon... */}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">Balance Suggestion</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Consider spending more time on underrepresented domains to achieve a more balanced lifestyle.
                                            Soon, this will be based directly on how you distribute your tasks across life domains.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
