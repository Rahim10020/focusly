/**
 * @fileoverview Leaderboard page for the Focusly application.
 * Displays global user rankings with tabs for tasks completed,
 * focus time, and streak metrics with pagination support.
 * @module app/leaderboard/page
 */

"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Card, { CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { LeaderboardUser, LeaderboardResponse } from "@/types/leaderboard";
import { DYNAMIC_ROUTES, ROUTES } from "@/constants";
import { API_DYNAMIC_ROUTES, API_ROUTES } from "@/constants";
import { MyLoader } from "@/components/shared/MyLoader";
import { formatHoursMinutesFromSeconds } from "@/lib/domain/services/StatsCalculationService";
import { InfoIcon } from "@/components/shared/icons";
import { useAppToast } from "@/hooks/useAppToast";
import { CacheService } from "@/lib/domain/services/CacheService";
import { LeaderboardHeader } from "@/app/(app)/leaderboard/_components/LeaderboardHeader";
import { LeaderboardPodium } from "@/app/(app)/leaderboard/_components/LeaderboardPodium";
import { LeaderboardList } from "@/app/(app)/leaderboard/_components/LeaderboardList";
import { LeaderboardPagination } from "@/app/(app)/leaderboard/_components/LeaderboardPagination";
import { LEADERBOARD_DEFAULTS } from "@/constants";

interface FriendData {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: "pending" | "accepted";
}

export default function LeaderboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { actionError } = useAppToast();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [pagination, setPagination] = useState<
    LeaderboardResponse["pagination"] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<"tasks" | "time" | "streak">(
    "tasks",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [timeFilter, setTimeFilter] = useState<"all" | "month" | "week">("all");
  const [friendRequestStatuses, setFriendRequestStatuses] = useState<
    Map<string, "none" | "pending" | "sent" | "friends">
  >(new Map());

  const fetchLeaderboard = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: LEADERBOARD_DEFAULTS.PAGE_SIZE.toString(),
      });
      if (timeFilter !== "all") {
        params.append("timeFilter", timeFilter);
      }

      const cacheKey = `leaderboard:${page}:${LEADERBOARD_DEFAULTS.PAGE_SIZE}:${timeFilter}`;
      const cachedData = await CacheService.getWithTTL<LeaderboardResponse>(
        cacheKey,
        LEADERBOARD_DEFAULTS.CLIENT_CACHE_TTL_MS,
      );
      if (cachedData) {
        setLeaderboard(cachedData.data || []);
        setPagination(cachedData.pagination || null);
        setLoading(false);
        return;
      }

      const response = await fetch(
        API_DYNAMIC_ROUTES.LEADERBOARD_WITH_QUERY(params),
      );
      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard");
      }
      const responseData = await response.json();
      // Extract data and pagination from the API response
      const data: LeaderboardResponse = responseData.data || responseData;
      const normalized: LeaderboardResponse = {
        data: Array.isArray(data) ? data : data?.data || [],
        pagination: data?.pagination || responseData?.pagination || null,
      };
      setLeaderboard(normalized.data || []);
      setPagination(normalized.pagination || null);
      await CacheService.set(cacheKey, normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendsAndRequests = async () => {
    try {
      const response = await fetch(API_ROUTES.FRIENDS);
      if (!response.ok) {
        throw new Error("Failed to fetch friends");
      }
      const responseData = await response.json();
      // Extract friends array from the API response
      const data: FriendData[] = responseData.data || [];
      const userId = session?.user?.id;

      // Update friend request statuses
      const statuses = new Map<
        string,
        "none" | "pending" | "sent" | "friends"
      >();
      data.forEach((friend: FriendData) => {
        const otherUserId =
          friend.sender_id === userId ? friend.receiver_id : friend.sender_id;
        if (friend.status === "accepted") {
          statuses.set(otherUserId, "friends");
        } else if (friend.status === "pending" && friend.sender_id === userId) {
          statuses.set(otherUserId, "sent");
        } else if (
          friend.status === "pending" &&
          friend.receiver_id === userId
        ) {
          statuses.set(otherUserId, "pending");
        }
      });
      setFriendRequestStatuses(statuses);
    } catch (err) {
      console.error("Error fetching friends:", err);
    }
  };

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push(ROUTES.SIGN_IN);
      return;
    }

    fetchLeaderboard(currentPage);
    fetchFriendsAndRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router, currentPage, timeFilter]);

  const formatTime = (seconds: number) =>
    formatHoursMinutesFromSeconds(seconds);

  const getSortedLeaderboard = () => {
    return [...leaderboard].sort((a, b) => {
      const aStats = a.stats || {
        completed_tasks: 0,
        total_focus_time: 0,
        streak: 0,
      };
      const bStats = b.stats || {
        completed_tasks: 0,
        total_focus_time: 0,
        streak: 0,
      };

      switch (selectedTab) {
        case "tasks":
          return bStats.completed_tasks - aStats.completed_tasks;
        case "time":
          return bStats.total_focus_time - aStats.total_focus_time;
        case "streak":
          return bStats.streak - aStats.streak;
        default:
          return 0;
      }
    });
  };

  const currentUserRank = leaderboard.findIndex(
    (user) => user.id === session?.user?.id,
  );

  const handleSendFriendRequest = async (userId: string) => {
    setFriendRequestStatuses((prev) => new Map(prev.set(userId, "pending")));
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

      setFriendRequestStatuses((prev) => new Map(prev.set(userId, "sent")));
      // Refresh friends and requests after sending
      fetchFriendsAndRequests();
    } catch (err) {
      actionError(err, "Failed to send friend request.");
      setFriendRequestStatuses((prev) => new Map(prev.set(userId, "none")));
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <MyLoader label="Loading Leaderboard" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 mx-auto mb-4 flex items-center justify-center">
            <InfoIcon size={32} className="text-red-500" />
          </div>
          <p className="text-red-500 mb-4 text-lg">Error: {error}</p>
          <Button onClick={() => fetchLeaderboard()}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  const sortedLeaderboard = getSortedLeaderboard();

  return (
    <div>
      <LeaderboardHeader />

      {/* Your Rank Card */}
      {currentUserRank >= 0 && (
        <Card variant="default" className="mb-8 overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-r from-primary/10 to-transparent opacity-50"></div>
          <CardContent className="relative py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-primary">
                  #{currentUserRank + 1}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Your Rank
                  </p>
                  <p className="text-xl font-semibold">
                    {session?.user?.name || "You"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">
                  Keep going!
                </p>
                <p className="text-lg font-semibold">
                  {leaderboard[currentUserRank]?.stats?.completed_tasks || 0}{" "}
                  tasks completed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Button
          variant={timeFilter === "all" ? "primary" : "outline"}
          onClick={() => setTimeFilter("all")}
          size="sm"
        >
          All Time
        </Button>
        <Button
          variant={timeFilter === "month" ? "primary" : "outline"}
          onClick={() => setTimeFilter("month")}
          size="sm"
        >
          This Month
        </Button>
        <Button
          variant={timeFilter === "week" ? "primary" : "outline"}
          onClick={() => setTimeFilter("week")}
          size="sm"
        >
          This Week
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-muted p-1 rounded-lg max-w-md mx-auto">
        <button
          onClick={() => setSelectedTab("tasks")}
          className={`flex-1 py-2 px-4 cursor-pointer rounded-md transition-all font-medium ${
            selectedTab === "tasks"
              ? "bg-primary text-primary-foreground shadow-lg"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Tasks
        </button>
        <button
          onClick={() => setSelectedTab("time")}
          className={`flex-1 py-2 px-4 cursor-pointer rounded-md transition-all font-medium ${
            selectedTab === "time"
              ? "bg-primary text-primary-foreground shadow-lg"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Focus Time
        </button>
        <button
          onClick={() => setSelectedTab("streak")}
          className={`flex-1 py-2 px-4 cursor-pointer rounded-md transition-all font-medium ${
            selectedTab === "streak"
              ? "bg-primary text-primary-foreground shadow-lg"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Streak
        </button>
      </div>

      <LeaderboardPodium
        leaderboard={sortedLeaderboard}
        selectedTab={selectedTab}
        formatTime={formatTime}
      />

      <LeaderboardList
        leaderboard={sortedLeaderboard}
        selectedTab={selectedTab}
        currentUserId={session?.user?.id}
        formatTime={formatTime}
        onSendFriendRequest={handleSendFriendRequest}
        friendRequestStatuses={friendRequestStatuses}
      />

      <LeaderboardPagination
        currentPage={currentPage}
        totalPages={pagination?.totalPages || 1}
        loading={loading}
        onPageChange={setCurrentPage}
      />

      {/* Pagination Info */}
      {pagination && (
        <div className="text-center text-sm text-muted-foreground mt-4">
          Showing {(currentPage - 1) * pagination.limit + 1} to{" "}
          {Math.min(currentPage * pagination.limit, pagination.total)} of{" "}
          {pagination.total} users
        </div>
      )}

      <style jsx global>{`
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
