"use client";

import { DateTimeService } from "@/lib/domain/services/DateTimeService";
/**
 * @fileoverview Leaderboard list component
 */

import Image from "next/image";
import Link from "next/link";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { LeaderboardUser } from "@/types/leaderboard";
import { DYNAMIC_ROUTES } from "@/constants";
import UsersIcon from "@/components/shared/icons/UsersIcon";

interface LeaderboardListProps {
  leaderboard: LeaderboardUser[];
  selectedTab: "tasks" | "time" | "streak";
  currentUserId?: string;
  rankOffset?: number;
}

export function LeaderboardList({
  leaderboard,
  selectedTab,
  currentUserId,
  rankOffset = 0,
}: LeaderboardListProps) {
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return "🥇";
      case 1:
        return "🥈";
      case 2:
        return "🥉";
      default:
        return null;
    }
  };

  const getDisplayValue = (user: LeaderboardUser) => {
    switch (selectedTab) {
      case "tasks":
        return user.stats?.completed_tasks || 0;
      case "time":
        return DateTimeService.formatTime(user.stats?.total_focus_time || 0);
      case "streak":
        return user.stats?.streak || 0;
      default:
        return 0;
    }
  };

  if (leaderboard.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>All Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <UsersIcon size={32} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg">
              No users found. Be the first to start focusing!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Rankings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mt-4 lg:mt-8">
          {leaderboard.map((user, index) => (
            <Link
              key={user.id}
              href={DYNAMIC_ROUTES.USER_PROFILE(user.id)}
              aria-label={`View ${user.username || "Player"}'s profile`}
              className={`flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer gap-3 sm:gap-0 ${
                user.id === currentUserId
                  ? "bg-primary/10"
                  : "hover:bg-muted/50 hover:scale-[1.02]"
              }`}
              style={{
                animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both`,
              }}
            >
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="w-10 sm:w-12 text-center shrink-0">
                  {getRankIcon(index + rankOffset) ? (
                    <span className="text-2xl sm:text-3xl">
                      {getRankIcon(index + rankOffset)}
                    </span>
                  ) : (
                    <span className="text-lg sm:text-xl font-bold text-muted-foreground">
                      #{index + rankOffset + 1}
                    </span>
                  )}
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 overflow-hidden shrink-0">
                  {user.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt={user.username || "Player"}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm sm:text-lg font-semibold">
                      {(user.username || "A").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate text-sm sm:text-base">
                    {user.username || "Player"}
                    {user.id === currentUserId && (
                      <span className="ml-1 sm:ml-2 text-xs bg-primary text-white px-1.5 sm:px-2 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {user.stats?.total_sessions || 0} sessions
                  </p>
                </div>
              </div>
              <div className="flex flex-col text-right">
                <p className="text-lg sm:text-xl font-bold">
                  {getDisplayValue(user)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedTab === "tasks" && "tasks completed"}
                  {selectedTab === "time" && "total focus"}
                  {selectedTab === "streak" && "day streak"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
