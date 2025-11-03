'use client';

import Header from '@/components/layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import StatsOverview from '@/components/stats/StatsOverview';
import { useStats } from '@/lib/hooks/useStats';
import { formatTime } from '@/lib/utils/time';

export default function StatsPage() {
    const { sessions } = useStats();

    const recentSessions = sessions
        .filter(session => session.completed)
        .slice(-10)
        .reverse();

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Statistics</h1>
                    <p className="text-muted-foreground">Track your productivity and progress</p>
                </div>

                <StatsOverview />

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
            </main>
        </div>
    );
}