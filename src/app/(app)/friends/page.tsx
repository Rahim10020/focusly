/**
 * @fileoverview Friends management page for the Focusly application.
 * Displays friend requests and friends list with accept/reject functionality
 * and navigation to friend profiles.
 * @module app/friends/page
 */

"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { debounce } from "@/lib/utils/debounce";
import { FriendsHeader } from "@/app/(app)/friends/_components/FriendsHeader";
import { UserSearch } from "@/app/(app)/friends/_components/UserSearch";
import { PendingRequests } from "@/app/(app)/friends/_components/PendingRequests";
import { FriendsList } from "@/app/(app)/friends/_components/FriendsList";
import { ROUTES } from "@/constants";
import { API_DYNAMIC_ROUTES, API_ROUTES } from "@/constants";
import { MyLoader } from "@/components/shared/MyLoader";
import { useAppToast } from "@/hooks/useAppToast";

interface User {
  id: string;
  username: string | null;
  avatar_url?: string | null;
  stats?: {
    completed_tasks: number;
  };
}

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
  status: "pending" | "accepted" | "rejected";
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

export default function FriendsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { actionSuccess, actionError } = useAppToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(
    new Set(),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push(ROUTES.SIGN_IN);
      return;
    }

    fetchFriends();
    fetchPendingRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router]);

  const fetchFriends = async () => {
    try {
      const response = await fetch(API_ROUTES.FRIENDS);
      if (!response.ok) {
        throw new Error("Failed to fetch friends");
      }
      const responseData = await response.json();
      // Extract friends array from the API response wrapper
      const data: Friend[] = responseData.data || [];
      // Filter to only accepted friends
      const acceptedFriends = data.filter(
        (friend) => friend.status === "accepted",
      );
      setFriends(acceptedFriends);
    } catch (err) {
      console.error("Error fetching friends:", err);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      // For now, we'll fetch all friend relationships and filter client-side
      // In a real app, you'd want a separate endpoint for pending requests
      const response = await fetch(API_ROUTES.FRIENDS);
      if (!response.ok) {
        throw new Error("Failed to fetch friend requests");
      }
      const responseData = await response.json();
      // Extract friends array from the API response wrapper
      const data: Friend[] = responseData.data || [];
      const userId = session?.user?.id;
      const pending = data.filter(
        (friend) =>
          friend.status === "pending" && friend.receiver_id === userId,
      );
      setPendingRequests(pending);
    } catch (err) {
      console.error("Error fetching pending requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    setProcessingRequests((prev) => {
      const newSet = new Set(prev);
      newSet.add(requestId);
      return newSet;
    });
    try {
      const response = await fetch(API_DYNAMIC_ROUTES.FRIEND_BY_ID(requestId), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "accept" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to accept friend request");
      }

      // Refresh data
      await Promise.all([fetchFriends(), fetchPendingRequests()]);
    } catch (err) {
      actionError(err, "Failed to accept friend request.");
    } finally {
      setProcessingRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setProcessingRequests((prev) => {
      const newSet = new Set(prev);
      newSet.add(requestId);
      return newSet;
    });
    try {
      const response = await fetch(API_DYNAMIC_ROUTES.FRIEND_BY_ID(requestId), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "reject" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reject friend request");
      }

      // Refresh data
      await Promise.all([fetchFriends(), fetchPendingRequests()]);
    } catch (err) {
      actionError(err, "Failed to reject friend request.");
    } finally {
      setProcessingRequests((prev) => {
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
      const response = await fetch(API_DYNAMIC_ROUTES.USERS_SEARCH(query));
      if (!response.ok) {
        throw new Error("Failed to search users");
      }
      const responseData = await response.json();
      // Extract users array from the API response wrapper
      const data = responseData.data || [];
      // Filter out current user and existing friends
      const friendIds = friends.map((f) =>
        f.sender_id === session?.user?.id ? f.receiver_id : f.sender_id,
      );
      const filtered = data.filter(
        (user: User) =>
          user.id !== session?.user?.id && !friendIds.includes(user.id),
      );
      setSearchResults(filtered);
    } catch (err) {
      console.error("Error searching users:", err);
    } finally {
      setSearching(false);
    }
  }, 300);

  const handleSendFriendRequest = async (userId: string) => {
    try {
      const response = await fetch(API_ROUTES.FRIENDS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ receiver_id: userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send friend request");
      }

      // Remove from search results
      setSearchResults((prev) => prev.filter((u) => u.id !== userId));
      actionSuccess("Friend request sent.");
    } catch (err) {
      actionError(err, "Failed to send friend request.");
    }
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    if (!confirm("Are you sure you want to remove this friend?")) {
      return;
    }

    try {
      const response = await fetch(
        API_DYNAMIC_ROUTES.FRIEND_BY_ID(friendshipId),
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove friend");
      }

      // Refresh friends list
      await fetchFriends();
    } catch (err) {
      actionError(err, "Failed to remove friend.");
    }
  };

  if (status === "loading" || loading) {
    return <MyLoader label="Loading friends" />;
  }

  return (
    <div>
      <FriendsHeader />

      <div className="space-y-6">
        <UserSearch
          searchQuery={searchQuery}
          searching={searching}
          searchResults={searchResults}
          onSearchChange={(query) => {
            setSearchQuery(query);
            searchUsers(query);
          }}
          onSendFriendRequest={handleSendFriendRequest}
        />

        <PendingRequests
          requests={pendingRequests}
          processingRequests={processingRequests}
          onAccept={handleAcceptRequest}
          onReject={handleRejectRequest}
        />

        <FriendsList
          friends={friends}
          currentUserId={session?.user?.id}
          onRemoveFriend={handleRemoveFriend}
        />
      </div>
    </div>
  );
}
