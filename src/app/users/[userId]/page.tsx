'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface UserStats {
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
        tasks_completed_today: number;
    } | null;
}

export default function UserProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const userId = params.userId as string;

    const [userStats, setUserStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sendingRequest, setSendingRequest] = useState(false);
    const [isFriend, setIsFriend] = useState(false);
    const [hasPendingRequest, setHasPendingRequest] = useState(false);

    useEffect(() => {
        if (status === 'loading') return;

        if (!session) {
            router.push('/auth/signin');
            return;
        }

        fetchUserStats();
    }, [session, status, router, userId]);

    const fetchUserStats = async () => {
        try {
            const response = await fetch(`/api/users/${userId}`);
            if (!response.ok) {
                if (response.status === 404) {
                    setError('User not found');
                } else {
                    throw new Error('Failed to fetch user stats');
                }
                return;
            }
            const data = await response.json();
            setUserStats(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleSendFriendRequest = async () => {
        if (!userStats) return;

        setSendingRequest(true);
        try {
            const response = await fetch('/api/friends', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ receiver_id: userId }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to send friend request');
            }

            setHasPendingRequest(true);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to send friend request');
        } finally {
            setSendingRequest(false);
        }
    };

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="max-w-4xl mx-auto px-6 py-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p>Loading user profile...</p>
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
                            <p className="text-red-500 mb-4">{error}</p>
                            <Button onClick={() => router.back()}>Go Back</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (!userStats) return null;

    const isOwnProfile = (session?.user as any)?.id === userStats?.id;

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="max-w-4xl mx-auto px-6 py-8">
                <div className="mb-8">
                    <Button
                        onClick={() => router.back()}
                        variant="secondary"
                        className="mb-4"
                    >
                        ← Back to Leaderboard
                    </Button>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            {userStats.avatar_url ? (
                                <img
                                    src={userStats.avatar_url}
                                    alt={userStats.username || 'User'}
                                    className="w-16 h-16 rounded-full"
                                />
                            ) : (
                                <span className="text-2xl">
                                    {(userStats.username || 'Anonymous').charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">
                                {userStats.username || 'Anonymous User'}
                            </h1>
                            {!isOwnProfile && (
                                <div className="mt-2">
                                    {hasPendingRequest ? (
                                        <Button disabled>Friend Request Sent</Button>
                                    ) : isFriend ? (
                                        <Button disabled>Friends</Button>
                                    ) : (
                                        <Button
                                            onClick={handleSendFriendRequest}
                                            disabled={sendingRequest}
                                        >
                                            {sendingRequest ? 'Sending...' : 'Send Friend Request'}
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Total Focus Time</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-primary">
                                {formatTime(userStats.stats?.total_focus_time || 0)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Total Sessions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-primary">
                                {userStats.stats?.total_sessions || 0}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Tasks Completed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-primary">
                                {userStats.stats?.completed_tasks || 0}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                of {userStats.stats?.total_tasks || 0} total
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Current Streak</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-primary">
                                {userStats.stats?.streak || 0} days
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Longest Streak</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-primary">
                                {userStats.stats?.longest_streak || 0} days
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Today's Tasks</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-primary">
                                {userStats.stats?.tasks_completed_today || 0}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                completed today
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}