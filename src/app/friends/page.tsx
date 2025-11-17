'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface Friend {
    id: string;
    sender_id: string;
    receiver_id: string;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
    sender: {
        username: string | null;
        avatar_url: string | null;
    } | null;
    receiver: {
        username: string | null;
        avatar_url: string | null;
    } | null;
}

export default function FriendsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (status === 'loading') return;

        if (!session) {
            router.push('/auth/signin');
            return;
        }

        fetchFriends();
        fetchPendingRequests();
    }, [session, status, router]);

    const fetchFriends = async () => {
        try {
            const response = await fetch('/api/friends');
            if (!response.ok) {
                throw new Error('Failed to fetch friends');
            }
            const data = await response.json();
            setFriends(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    const fetchPendingRequests = async () => {
        try {
            // For now, we'll fetch all friend relationships and filter client-side
            // In a real app, you'd want a separate endpoint for pending requests
            const response = await fetch('/api/friends');
            if (!response.ok) {
                throw new Error('Failed to fetch friend requests');
            }
            const data: Friend[] = await response.json();
            const userId = session?.user?.id;
            const pending = data.filter(friend =>
                friend.status === 'pending' && friend.receiver_id === userId
            );
            setPendingRequests(pending);
        } catch (err) {
            console.error('Error fetching pending requests:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptRequest = async (requestId: string) => {
        setProcessingRequests(prev => {
            const newSet = new Set(prev);
            newSet.add(requestId);
            return newSet;
        });
        try {
            const response = await fetch(`/api/friends/${requestId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'accept' }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to accept friend request');
            }

            // Refresh data
            await Promise.all([fetchFriends(), fetchPendingRequests()]);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to accept friend request');
        } finally {
            setProcessingRequests(prev => {
                const newSet = new Set(prev);
                newSet.delete(requestId);
                return newSet;
            });
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        setProcessingRequests(prev => {
            const newSet = new Set(prev);
            newSet.add(requestId);
            return newSet;
        });
        try {
            const response = await fetch(`/api/friends/${requestId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'reject' }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to reject friend request');
            }

            // Refresh data
            await Promise.all([fetchFriends(), fetchPendingRequests()]);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to reject friend request');
        } finally {
            setProcessingRequests(prev => {
                const newSet = new Set(prev);
                newSet.delete(requestId);
                return newSet;
            });
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="max-w-4xl mx-auto px-6 py-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p>Loading friends...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="max-w-4xl mx-auto px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">Friends</h1>
                    <p className="text-muted-foreground">
                        Manage your friends and friend requests
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Pending Requests */}
                    {pendingRequests.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Friend Requests</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {pendingRequests.map((request) => (
                                        <div
                                            key={request.id}
                                            className="flex items-center justify-between p-4 rounded-lg border border-border"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    {request.sender?.avatar_url ? (
                                                        <img
                                                            src={request.sender.avatar_url}
                                                            alt={request.sender.username || 'User'}
                                                            className="w-10 h-10 rounded-full"
                                                        />
                                                    ) : (
                                                        <span className="text-lg">
                                                            {(request.sender?.username || 'Anonymous').charAt(0).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium">
                                                        {request.sender?.username || 'Anonymous User'}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Sent you a friend request
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => handleAcceptRequest(request.id)}
                                                    disabled={processingRequests.has(request.id)}
                                                    size="sm"
                                                >
                                                    {processingRequests.has(request.id) ? 'Accepting...' : 'Accept'}
                                                </Button>
                                                <Button
                                                    onClick={() => handleRejectRequest(request.id)}
                                                    disabled={processingRequests.has(request.id)}
                                                    variant="secondary"
                                                    size="sm"
                                                >
                                                    {processingRequests.has(request.id) ? 'Rejecting...' : 'Reject'}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Friends List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>My Friends ({friends.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {friends.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    No friends yet. Visit the leaderboard to find and add friends!
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {friends.map((friend) => {
                                        const friendUser = friend.sender_id === session?.user?.id
                                            ? friend.receiver
                                            : friend.sender;
                                        const friendId = friend.sender_id === session?.user?.id
                                            ? friend.receiver_id
                                            : friend.sender_id;

                                        return (
                                            <div
                                                key={friend.id}
                                                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                                                onClick={() => router.push(`/users/${friendId}`)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                        {friendUser?.avatar_url ? (
                                                            <img
                                                                src={friendUser.avatar_url}
                                                                alt={friendUser.username || 'User'}
                                                                className="w-10 h-10 rounded-full"
                                                            />
                                                        ) : (
                                                            <span className="text-lg">
                                                                {(friendUser?.username || 'Anonymous').charAt(0).toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">
                                                            {friendUser?.username || 'Anonymous User'}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Friends since {new Date(friend.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button variant="secondary" size="sm">
                                                    View Profile
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}