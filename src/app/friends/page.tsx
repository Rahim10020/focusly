/**
 * @fileoverview Friends management page for the Focusly application.
 * Displays friend requests and friends list with accept/reject functionality
 * and navigation to friend profiles.
 * @module app/friends/page
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { debounce } from '@/lib/utils/debounce';

/**
 * Represents a friend relationship between users.
 * @interface Friend
 */
interface Friend {
    /** Unique friendship identifier */
    id: string;
    /** ID of the user who sent the request */
    sender_id: string;
    /** ID of the user who received the request */
    receiver_id: string;
    /** Current status of the friend request */
    status: 'pending' | 'accepted' | 'rejected';
    /** Timestamp when the request was created */
    created_at: string;
    /** Information about the sender */
    sender: {
        username: string | null;
        avatar_url: string | null;
    } | null;
    /** Information about the receiver */
    receiver: {
        username: string | null;
        avatar_url: string | null;
    } | null;
}

/**
 * Friends page component for managing friend relationships.
 * Displays pending friend requests with accept/reject actions
 * and a list of accepted friends with profile navigation.
 *
 * @returns {JSX.Element} The rendered friends page
 */
export default function FriendsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

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
            const responseData = await response.json();
            // Extract friends array from the API response wrapper
            const data: Friend[] = responseData.data || [];
            // Filter to only accepted friends
            const acceptedFriends = data.filter(friend => friend.status === 'accepted');
            setFriends(acceptedFriends);
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
            const responseData = await response.json();
            // Extract friends array from the API response wrapper
            const data: Friend[] = responseData.data || [];
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

    const searchUsers = debounce(async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            setSearching(false);
            return;
        }

        setSearching(true);
        try {
            const response = await fetch(`/api/users?search=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error('Failed to search users');
            }
            const responseData = await response.json();
            // Extract users array from the API response wrapper
            const data = responseData.data || [];
            // Filter out current user and existing friends
            const friendIds = friends.map(f =>
                f.sender_id === session?.user?.id ? f.receiver_id : f.sender_id
            );
            const filtered = data.filter((user: any) =>
                user.id !== session?.user?.id && !friendIds.includes(user.id)
            );
            setSearchResults(filtered);
        } catch (err) {
            console.error('Error searching users:', err);
        } finally {
            setSearching(false);
        }
    }, 300);

    const handleSendFriendRequest = async (userId: string) => {
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

            // Remove from search results
            setSearchResults(prev => prev.filter(u => u.id !== userId));
            alert('Friend request sent!');
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to send friend request');
        }
    };

    const handleRemoveFriend = async (friendshipId: string) => {
        if (!confirm('Are you sure you want to remove this friend?')) {
            return;
        }

        try {
            const response = await fetch(`/api/friends/${friendshipId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to remove friend');
            }

            // Refresh friends list
            await fetchFriends();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to remove friend');
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
                    {/* Search Users */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Find Friends</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Input
                                placeholder="Search users by username..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    searchUsers(e.target.value);
                                }}
                            />
                            {searching && (
                                <div className="mt-4 text-center text-muted-foreground">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                                </div>
                            )}
                            {!searching && searchResults.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    {searchResults.map((user) => (
                                        <div
                                            key={user.id}
                                            className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50"
                                        >
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
                                                            {(user.username || 'A').charAt(0).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{user.username || 'Anonymous User'}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {user.stats?.completed_tasks || 0} tasks completed
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => handleSendFriendRequest(user.id)}
                                                size="sm"
                                            >
                                                Add Friend
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {!searching && searchQuery && searchResults.length === 0 && (
                                <p className="mt-4 text-center text-muted-foreground">No users found</p>
                            )}
                        </CardContent>
                    </Card>

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
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                        }}
                                                    >
                                                        View Profile
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveFriend(friend.id);
                                                        }}
                                                        className="text-red-500 hover:text-red-600"
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
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