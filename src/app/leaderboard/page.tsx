'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface LeaderboardUser {
    id: string;
    username: string | null;
    avatar_url: string | null;
    stats: {
        total_sessions: number;
        completed_tasks: number;
        total_tasks: number;
        streak: number;
        total_focus_time: number;
        longest_streak: number;
    } | null;
}

export default function LeaderboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'loading') return;

        if (!session) {
            router.push('/auth/signin');
            return;
        }

        fetchLeaderboard();
    }, [session, status, router]);

    const fetchLeaderboard = async () => {
        try {
            const response = await fetch('/api/leaderboard');
            if (!response.ok) {
                throw new Error('Failed to fetch leaderboard');
            }
            const data = await response.json();
            setLeaderboard(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0:
                return '🥇';
            case 1:
                return '🥈';
            case 2:
                return '🥉';
            default:
                return `#${index + 1}`;
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="max-w-4xl mx-auto px-6 py-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p>Loading leaderboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="max-w-4xl mx-auto px-6 py-8">
                    <Card>
                        <CardContent className="p-6 text-center">
                            <p className="text-red-500 mb-4">Error: {error}</p>
                            <Button onClick={fetchLeaderboard}>Try Again</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="max-w-4xl mx-auto px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
                    <p className="text-muted-foreground">
                        See how you rank against other Focusly users
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Top Performers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {leaderboard.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                No users found. Be the first to start focusing!
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {leaderboard.map((user, index) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                                        onClick={() => router.push(`/users/${user.id}`)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="text-2xl font-bold text-muted-foreground w-12 text-center">
                                                {getRankIcon(index)}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    {user.avatar_url ? (
                                                        <img
                                                            src={user.avatar_url}
                                                            alt={user.username || 'User'}
                                                            className="w-10 h-10 rounded-full"
                                                        />
                                                    ) : (
                                                        <span className="text-lg">
                                                            {(user.username || 'Anonymous').charAt(0).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium">
                                                        {user.username || 'Anonymous User'}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {user.stats?.total_sessions || 0} sessions • {formatTime(user.stats?.total_focus_time || 0)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">{user.stats?.completed_tasks || 0} tasks</p>
                                            <p className="text-sm text-muted-foreground">
                                                {user.stats?.streak || 0} day streak
                                            </p>
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