/**
 * @fileoverview Leaderboard page for the Focusly application.
 * Displays global user rankings with tabs for tasks completed,
 * focus time, and streak metrics with pagination support.
 * @module app/leaderboard/page
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { startOfWeek, startOfMonth } from 'date-fns';
import Header from '@/components/layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

/**
 * Represents a user in the leaderboard with their stats.
 * @interface LeaderboardUser
 */
interface LeaderboardUser {
    /** Unique user identifier */
    id: string;
    /** User's display name */
    username: string | null;
    /** URL to user's avatar image */
    avatar_url: string | null;
    /** User's productivity statistics */
    stats: {
        total_sessions: number;
        completed_tasks: number;
        total_tasks: number;
        streak: number;
        total_focus_time: number;
        longest_streak: number;
    } | null;
}

/**
 * API response structure for leaderboard data.
 * @interface LeaderboardResponse
 */
interface LeaderboardResponse {
    /** Array of leaderboard users */
    data: LeaderboardUser[];
    /** Pagination information */
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

/**
 * Leaderboard page component displaying user rankings.
 * Features tabs for different metrics (tasks, time, streak),
 * top 3 podium display, paginated list, and user rank highlight.
 *
 * @returns {JSX.Element} The rendered leaderboard page
 */
export default function LeaderboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [pagination, setPagination] = useState<LeaderboardResponse['pagination'] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTab, setSelectedTab] = useState<'tasks' | 'time' | 'streak'>('tasks');
    const [currentPage, setCurrentPage] = useState(1);
    const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'week'>('all');
    const [friendRequestStatuses, setFriendRequestStatuses] = useState<Map<string, 'none' | 'pending' | 'sent' | 'friends'>>(new Map());
    const [friends, setFriends] = useState<string[]>([]);
    const [pendingRequests, setPendingRequests] = useState<string[]>([]);

    useEffect(() => {
        if (status === 'loading') return;

        if (!session) {
            router.push('/auth/signin');
            return;
        }

        fetchLeaderboard(currentPage);
        fetchFriendsAndRequests();
    }, [session, status, router, currentPage, timeFilter]);

    const fetchLeaderboard = async (page: number = 1) => {
        try {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20'
            });
            if (timeFilter !== 'all') {
                params.append('timeFilter', timeFilter);
            }
            const response = await fetch(`/api/leaderboard?${params}`);
            if (!response.ok) {
                throw new Error('Failed to fetch leaderboard');
            }
            const data: LeaderboardResponse = await response.json();
            setLeaderboard(data.data);
            setPagination(data.pagination);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const fetchFriendsAndRequests = async () => {
        try {
            const response = await fetch('/api/friends');
            if (!response.ok) {
                throw new Error('Failed to fetch friends');
            }
            const data = await response.json();
            const userId = session?.user?.id;

            // Get friend IDs (accepted)
            const friendIds = data
                .filter((friend: any) => friend.status === 'accepted')
                .map((friend: any) =>
                    friend.sender_id === userId ? friend.receiver_id : friend.sender_id
                );
            setFriends(friendIds);

            // Get pending request IDs (sent by current user)
            const pendingIds = data
                .filter((friend: any) =>
                    friend.status === 'pending' && friend.sender_id === userId
                )
                .map((friend: any) => friend.receiver_id);
            setPendingRequests(pendingIds);

            // Update friend request statuses
            const statuses = new Map<string, 'none' | 'pending' | 'sent' | 'friends'>();
            data.forEach((friend: any) => {
                const otherUserId = friend.sender_id === userId ? friend.receiver_id : friend.sender_id;
                if (friend.status === 'accepted') {
                    statuses.set(otherUserId, 'friends');
                } else if (friend.status === 'pending' && friend.sender_id === userId) {
                    statuses.set(otherUserId, 'sent');
                } else if (friend.status === 'pending' && friend.receiver_id === userId) {
                    statuses.set(otherUserId, 'pending');
                }
            });
            setFriendRequestStatuses(statuses);
        } catch (err) {
            console.error('Error fetching friends:', err);
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
                return null;
        }
    };

    const getRankColor = (index: number) => {
        switch (index) {
            case 0:
                return 'from-yellow-400 to-yellow-600';
            case 1:
                return 'from-gray-300 to-gray-500';
            case 2:
                return 'from-amber-600 to-amber-800';
            default:
                return 'from-primary/20 to-primary/10';
        }
    };

    const getSortedLeaderboard = () => {
        return [...leaderboard].sort((a, b) => {
            const aStats = a.stats || { completed_tasks: 0, total_focus_time: 0, streak: 0 };
            const bStats = b.stats || { completed_tasks: 0, total_focus_time: 0, streak: 0 };

            switch (selectedTab) {
                case 'tasks':
                    return bStats.completed_tasks - aStats.completed_tasks;
                case 'time':
                    return bStats.total_focus_time - aStats.total_focus_time;
                case 'streak':
                    return bStats.streak - aStats.streak;
                default:
                    return 0;
            }
        });
    };

    const currentUserRank = leaderboard.findIndex(user => user.id === session?.user?.id);

    const handleSendFriendRequest = async (userId: string) => {
        setFriendRequestStatuses(prev => new Map(prev.set(userId, 'pending')));
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

            setFriendRequestStatuses(prev => new Map(prev.set(userId, 'sent')));
            // Refresh friends and requests after sending
            fetchFriendsAndRequests();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to send friend request');
            setFriendRequestStatuses(prev => new Map(prev.set(userId, 'none')));
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-lg">Loading leaderboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <Card>
                        <CardContent className="p-8 text-center">
                            <div className="w-16 h-16 rounded-full bg-red-500/10 mx-auto mb-4 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                            </div>
                            <p className="text-red-500 mb-4 text-lg">Error: {error}</p>
                            <Button onClick={() => fetchLeaderboard()}>Try Again</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const sortedLeaderboard = getSortedLeaderboard();

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Leaderboard
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Compete with other Focusly users and climb to the top!
                    </p>
                </div>

                {/* Your Rank Card */}
                {currentUserRank >= 0 && (
                    <Card variant="default" className="mb-8 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50"></div>
                        <CardContent className="relative py-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="text-3xl font-bold text-primary">
                                        #{currentUserRank + 1}
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Your Rank</p>
                                        <p className="text-xl font-semibold">{session?.user?.name || 'You'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground mb-1">Keep going!</p>
                                    <p className="text-lg font-semibold">
                                        {leaderboard[currentUserRank]?.stats?.completed_tasks || 0} tasks completed
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Time Filter */}
                <div className="flex gap-2 mb-4 flex-wrap">
                    <Button
                        variant={timeFilter === 'all' ? 'primary' : 'outline'}
                        onClick={() => setTimeFilter('all')}
                        size="sm"
                    >
                        All Time
                    </Button>
                    <Button
                        variant={timeFilter === 'month' ? 'primary' : 'outline'}
                        onClick={() => setTimeFilter('month')}
                        size="sm"
                    >
                        This Month
                    </Button>
                    <Button
                        variant={timeFilter === 'week' ? 'primary' : 'outline'}
                        onClick={() => setTimeFilter('week')}
                        size="sm"
                    >
                        This Week
                    </Button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-muted p-1 rounded-lg max-w-md mx-auto">
                    <button
                        onClick={() => setSelectedTab('tasks')}
                        className={`flex-1 py-2 px-4 cursor-pointer rounded-md transition-all font-medium ${selectedTab === 'tasks'
                            ? 'bg-primary text-primary-foreground shadow-lg'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Tasks
                    </button>
                    <button
                        onClick={() => setSelectedTab('time')}
                        className={`flex-1 py-2 px-4 cursor-pointer rounded-md transition-all font-medium ${selectedTab === 'time'
                            ? 'bg-primary text-primary-foreground shadow-lg'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Focus Time
                    </button>
                    <button
                        onClick={() => setSelectedTab('streak')}
                        className={`flex-1 py-2 px-4 cursor-pointer rounded-md transition-all font-medium ${selectedTab === 'streak'
                            ? 'bg-primary text-primary-foreground shadow-lg'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Streak
                    </button>
                </div>

                {/* Podium - Top 3 */}
                {sortedLeaderboard.length >= 3 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-4xl mx-auto">
                        {/* Second Place */}
                        <div className="flex flex-col items-center md:order-1 md:mt-8">
                            <Card variant="elevated" className="w-full overflow-hidden">
                                <div className={`h-2 bg-gradient-to-r ${getRankColor(1)}`}></div>
                                <CardContent className="pt-6 pb-4 text-center">
                                    <div className="text-4xl mb-2">{getRankIcon(1)}</div>
                                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-r from-gray-300 to-gray-500 p-1">
                                        <img
                                            src={sortedLeaderboard[1].avatar_url || '/default-avatar.svg'}
                                            alt={sortedLeaderboard[1].username || 'Player'}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    </div>
                                    <p className="font-bold text-sm mb-1">{sortedLeaderboard[1].username || 'Player'}</p>
                                    <p className="text-2xl font-bold text-primary mb-1">
                                        {selectedTab === 'tasks' && (sortedLeaderboard[1].stats?.completed_tasks || 0)}
                                        {selectedTab === 'time' && formatTime(sortedLeaderboard[1].stats?.total_focus_time || 0)}
                                        {selectedTab === 'streak' && `${sortedLeaderboard[1].stats?.streak || 0}`}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {selectedTab === 'tasks' && 'tasks'}
                                        {selectedTab === 'time' && 'focused'}
                                        {selectedTab === 'streak' && 'day streak'}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* First Place */}
                        <div className="flex flex-col items-center md:order-0 col-span-1">
                            <Card variant="elevated" className="w-full overflow-hidden md:transform md:scale-110">
                                <div className={`h-2 bg-gradient-to-r ${getRankColor(0)}`}></div>
                                <CardContent className="pt-6 pb-4 text-center">
                                    <div className="text-5xl mb-2">{getRankIcon(0)}</div>
                                    <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 p-1">
                                        <img
                                            src={sortedLeaderboard[0].avatar_url || '/default-avatar.svg'}
                                            alt={sortedLeaderboard[0].username || 'Player'}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    </div>
                                    <p className="font-bold mb-1">{sortedLeaderboard[0].username || 'Player'}</p>
                                    <p className="text-3xl font-bold text-primary mb-1">
                                        {selectedTab === 'tasks' && (sortedLeaderboard[0].stats?.completed_tasks || 0)}
                                        {selectedTab === 'time' && formatTime(sortedLeaderboard[0].stats?.total_focus_time || 0)}
                                        {selectedTab === 'streak' && `${sortedLeaderboard[0].stats?.streak || 0}`}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedTab === 'tasks' && 'tasks'}
                                        {selectedTab === 'time' && 'focused'}
                                        {selectedTab === 'streak' && 'day streak'}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Third Place */}
                        <div className="flex flex-col items-center md:order-2 md:mt-12">
                            <Card variant="elevated" className="w-full overflow-hidden">
                                <div className={`h-2 bg-gradient-to-r ${getRankColor(2)}`}></div>
                                <CardContent className="pt-6 pb-4 text-center">
                                    <div className="text-4xl mb-2">{getRankIcon(2)}</div>
                                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-r from-amber-600 to-amber-800 p-1">
                                        <img
                                            src={sortedLeaderboard[2].avatar_url || '/default-avatar.svg'}
                                            alt={sortedLeaderboard[2].username || 'Player'}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    </div>
                                    <p className="font-bold text-sm mb-1">{sortedLeaderboard[2].username || 'Player'}</p>
                                    <p className="text-2xl font-bold text-primary mb-1">
                                        {selectedTab === 'tasks' && (sortedLeaderboard[2].stats?.completed_tasks || 0)}
                                        {selectedTab === 'time' && formatTime(sortedLeaderboard[2].stats?.total_focus_time || 0)}
                                        {selectedTab === 'streak' && `${sortedLeaderboard[2].stats?.streak || 0}`}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {selectedTab === 'tasks' && 'tasks'}
                                        {selectedTab === 'time' && 'focused'}
                                        {selectedTab === 'streak' && 'day streak'}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* Rest of Leaderboard */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Rankings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {sortedLeaderboard.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="9" cy="7" r="4"></circle>
                                        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path>
                                    </svg>
                                </div>
                                <p className="text-muted-foreground text-lg">
                                    No users found. Be the first to start focusing!
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {sortedLeaderboard.map((user, index) => (
                                    <div
                                        key={user.id}
                                        className={`flex items-center justify-between p-4 rounded-lg transition-all cursor-pointer ${user.id === session?.user?.id
                                            ? 'bg-primary/10 border-2 border-primary'
                                            : 'border border-border hover:bg-muted/50 hover:scale-[1.02]'
                                            }`}
                                        onClick={() => router.push(`/users/${user.id}`)}
                                        style={{
                                            animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both`
                                        }}
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-12 text-center">
                                                {getRankIcon(index) ? (
                                                    <span className="text-3xl">{getRankIcon(index)}</span>
                                                ) : (
                                                    <span className="text-xl font-bold text-muted-foreground">#{index + 1}</span>
                                                )}
                                            </div>
                                            <div className="w-12 h-12 rounded-full bg-primary/10 overflow-hidden flex-shrink-0">
                                                {user.avatar_url ? (
                                                    <img
                                                        src={user.avatar_url}
                                                        alt={user.username || 'Player'}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-lg font-semibold">
                                                        {(user.username || 'A').charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold truncate">
                                                    {user.username || 'Player'}
                                                    {user.id === session?.user?.id && (
                                                        <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                                            You
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {user.stats?.total_sessions || 0} sessions
                                                </p>
                                                {user.id !== session?.user?.id && (
                                                    <div className="mt-1">
                                                        {friendRequestStatuses.get(user.id) === 'friends' ? (
                                                            <Button size="sm" disabled variant="secondary">Friends</Button>
                                                        ) : friendRequestStatuses.get(user.id) === 'sent' ? (
                                                            <Button size="sm" disabled>Friend Request Sent</Button>
                                                        ) : friendRequestStatuses.get(user.id) === 'pending' ? (
                                                            <Button size="sm" disabled>Request Pending</Button>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleSendFriendRequest(user.id);
                                                                }}
                                                            >
                                                                Send Friend Request
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-bold">
                                                {selectedTab === 'tasks' && (user.stats?.completed_tasks || 0)}
                                                {selectedTab === 'time' && formatTime(user.stats?.total_focus_time || 0)}
                                                {selectedTab === 'streak' && (user.stats?.streak || 0)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {selectedTab === 'tasks' && 'tasks completed'}
                                                {selectedTab === 'time' && 'total focus'}
                                                {selectedTab === 'streak' && 'day streak'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1 || loading}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Previous
                        </Button>

                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, currentPage - 2)) + i;
                                if (pageNum > pagination.totalPages) return null;

                                return (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? "primary" : "outline"}
                                        size="sm"
                                        onClick={() => setCurrentPage(pageNum)}
                                        disabled={loading}
                                        className="w-10 h-10"
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}
                        </div>

                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                            disabled={currentPage === pagination.totalPages || loading}
                        >
                            Next
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Button>
                    </div>
                )}

                {/* Pagination Info */}
                {pagination && (
                    <div className="text-center text-sm text-muted-foreground mt-4">
                        Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} users
                    </div>
                )}
            </main>

            <style jsx>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}
