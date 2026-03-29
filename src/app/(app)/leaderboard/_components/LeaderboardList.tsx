"use client";

import { DateTimeService } from "@/lib/domain/services/DateTimeService";
/**
 * @fileoverview Leaderboard list component
 */

import Image from "next/image";
import { useRouter } from "next/navigation";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { LeaderboardUser } from "@/types/leaderboard";
import { DYNAMIC_ROUTES } from "@/constants";
import UsersIcon from "@/components/shared/icons/UsersIcon";

interface LeaderboardListProps {
  leaderboard: LeaderboardUser[];
  selectedTab: "tasks" | "time" | "streak";
  currentUserId?: string;
  formatTime: (seconds: number) => string;
  onSendFriendRequest?: (userId: string) => void;
  friendRequestStatuses?: Map<string, "none" | "pending" | "sent" | "friends">;
}

export function LeaderboardList({
  leaderboard,
  selectedTab,
  currentUserId,
  formatTime,
  onSendFriendRequest,
  friendRequestStatuses,
}: LeaderboardListProps) {
  const router = useRouter();

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
        <div className="space-y-2">
          {leaderboard.map((user, index) => (
            <div
              key={user.id}
              className={`flex items-center justify-between p-4 rounded-lg transition-all cursor-pointer ${
                user.id === currentUserId
                  ? "bg-primary/10 border-2 border-primary"
                  : "border border-border hover:bg-muted/50 hover:scale-[1.02]"
              }`}
              onClick={() => router.push(DYNAMIC_ROUTES.USER_PROFILE(user.id))}
              style={{
                animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both`,
              }}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 text-center">
                  {getRankIcon(index) ? (
                    <span className="text-3xl">{getRankIcon(index)}</span>
                  ) : (
                    <span className="text-xl font-bold text-muted-foreground">
                      #{index + 1}
                    </span>
                  )}
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 overflow-hidden shrink-0">
                  {user.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt={user.username || "Player"}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg font-semibold">
                      {(user.username || "A").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">
                    {user.username || "Player"}
                    {user.id === currentUserId && (
                      <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {user.stats?.total_sessions || 0} sessions
                  </p>
                  {user.id !== currentUserId &&
                    onSendFriendRequest &&
                    friendRequestStatuses && (
                      <div className="mt-1">
                        {friendRequestStatuses.get(user.id) === "friends" ? (
                          <Button size="sm" disabled variant="secondary">
                            Friends
                          </Button>
                        ) : friendRequestStatuses.get(user.id) === "sent" ? (
                          <Button size="sm" disabled>
                            Friend Request Sent
                          </Button>
                        ) : friendRequestStatuses.get(user.id) === "pending" ? (
                          <Button size="sm" disabled>
                            Request Pending
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSendFriendRequest(user.id);
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
                <p className="text-xl font-bold">{getDisplayValue(user)}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedTab === "tasks" && "tasks completed"}
                  {selectedTab === "time" && "total focus"}
                  {selectedTab === "streak" && "day streak"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
