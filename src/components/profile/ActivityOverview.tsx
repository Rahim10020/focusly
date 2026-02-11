/**
 * @fileoverview Activity overview component displaying user performance metrics.
 * @module components/profile/ActivityOverview
 */

'use client';

import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface ActivityOverviewProps {
    completionRate: number;
    longestStreak: number;
    activeTasks: number;
}

export function ActivityOverview({
    completionRate,
    longestStreak,
    activeTasks,
}: ActivityOverviewProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Activity Overview</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium">Completion Rate</p>
                                <p className="text-sm text-muted-foreground">{completionRate}% of tasks</p>
                            </div>
                        </div>
                        <div className="text-2xl font-bold">{completionRate}%</div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium">Longest Streak</p>
                                <p className="text-sm text-muted-foreground">Best performance</p>
                            </div>
                        </div>
                        <div className="text-2xl font-bold">{longestStreak} days</div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
                                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium">Active Tasks</p>
                                <p className="text-sm text-muted-foreground">In progress</p>
                            </div>
                        </div>
                        <div className="text-2xl font-bold">{activeTasks}</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
