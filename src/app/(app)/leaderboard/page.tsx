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
import { ROUTES } from "@/constants";
import { API_DYNAMIC_ROUTES } from "@/constants";
import { MyLoader } from "@/components/shared/MyLoader";
import { InfoIcon } from "@/components/shared/icons";
import { CacheService } from "@/lib/domain/services/CacheService";
import { LeaderboardHeader } from "@/app/(app)/leaderboard/_components/LeaderboardHeader";
import { LeaderboardPodium } from "@/app/(app)/leaderboard/_components/LeaderboardPodium";
import { LeaderboardList } from "@/app/(app)/leaderboard/_components/LeaderboardList";
import { LeaderboardPagination } from "@/app/(app)/leaderboard/_components/LeaderboardPagination";
import { LEADERBOARD_DEFAULTS } from "@/constants";

export default function LeaderboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
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

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push(ROUTES.SIGN_IN);
      return;
    }

    fetchLeaderboard(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router, currentPage, timeFilter]);

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
          <div className="w-16 h-16 rounded-full bg-error/10 mx-auto mb-4 flex items-center justify-center">
            <InfoIcon size={32} className="text-error" />
          </div>
          <p className="text-error mb-4 text-lg">Error: {error}</p>
          <Button onClick={() => fetchLeaderboard()}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  const sortedLeaderboard = getSortedLeaderboard();

  return (
    <div>
      <LeaderboardHeader />

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-12">
        {/* Left Column: Time Filter (desktop only) */}
        <div className="md:sticky md:top-24 md:self-start">
          <div className="flex md:flex-col gap-2 md:gap-4 flex-wrap md:flex-nowrap">
            <Button
              variant={timeFilter === "all" ? "primary" : "outline"}
              onClick={() => setTimeFilter("all")}
              size="md"
              disabled={loading}
            >
              All Time
            </Button>
            <Button
              variant={timeFilter === "month" ? "primary" : "outline"}
              onClick={() => setTimeFilter("month")}
              size="md"
              disabled={loading}
            >
              This Month
            </Button>
            <Button
              variant={timeFilter === "week" ? "primary" : "outline"}
              onClick={() => setTimeFilter("week")}
              size="md"
              disabled={loading}
            >
              This Week
            </Button>
          </div>
        </div>

        {/* Right Column: Main Content */}
        <div className="space-y-6">
          {/* Your Rank Card */}
          {currentUserRank >= 0 && (
            <Card variant="default" className="relative overflow-hidden">
              <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-primary/10 to-transparent opacity-50"></div>
              <CardContent className="relative py-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl sm:text-4xl font-bold text-primary">
                      #{currentUserRank + 1}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Your Rank
                      </p>
                      <p className="text-lg sm:text-xl font-semibold">
                        {session?.user?.name || "You"}
                      </p>
                    </div>
                  </div>
                  <div className="text-center sm:text-right">
                    <p className="text-sm text-muted-foreground mb-1">
                      Keep going!
                    </p>
                    <p className="text-base sm:text-lg font-semibold">
                      {leaderboard[currentUserRank]?.stats?.completed_tasks ||
                        0}{" "}
                      tasks completed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <div className="flex gap-2 bg-muted p-1 rounded-2xl">
            <button
              onClick={() => setSelectedTab("tasks")}
              className={`flex-1 py-2 px-4 cursor-pointer rounded-2xl transition-all font-medium ${
                selectedTab === "tasks"
                  ? "bg-primary text-white shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Tasks
            </button>
            <button
              onClick={() => setSelectedTab("time")}
              className={`flex-1 py-2 px-4 cursor-pointer rounded-2xl transition-all font-medium ${
                selectedTab === "time"
                  ? "bg-primary text-white shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Focus Time
            </button>
            <button
              onClick={() => setSelectedTab("streak")}
              className={`flex-1 py-2 px-4 cursor-pointer rounded-2xl transition-all font-medium ${
                selectedTab === "streak"
                  ? "bg-primary text-white shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Streak
            </button>
          </div>

          <LeaderboardPodium
            leaderboard={sortedLeaderboard}
            selectedTab={selectedTab}
          />

          <LeaderboardList
            leaderboard={sortedLeaderboard}
            selectedTab={selectedTab}
            currentUserId={session?.user?.id}
          />

          <LeaderboardPagination
            currentPage={currentPage}
            totalPages={pagination?.totalPages || 1}
            loading={loading}
            onPageChange={setCurrentPage}
          />

          {/* Pagination Info */}
          {pagination && (
            <div className="text-center text-sm text-muted-foreground">
              Showing {(currentPage - 1) * pagination.limit + 1} to{" "}
              {Math.min(currentPage * pagination.limit, pagination.total)} of{" "}
              {pagination.total} users
            </div>
          )}
        </div>
      </div>

      <style>{`
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
