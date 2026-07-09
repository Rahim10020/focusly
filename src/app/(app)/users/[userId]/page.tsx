"use client";

import { DateTimeService } from "@/lib/domain/services/DateTimeService";
/**
 * @fileoverview User Profile page for viewing other users in the Focusly application.
 * Displays user statistics, avatar, and provides friend request functionality
 * for public user profiles accessed from leaderboard or friend lists.
 * @module app/(app)/users/[userId]/page
 */

import {
  useCallback,
  useEffect,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { useSession } from "@/hooks/useAuth";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ROUTES } from "@/constants";
import { API_DYNAMIC_ROUTES, API_ROUTES } from "@/constants";
import { MyLoader } from "@/components/shared/MyLoader";
import { useAppToast } from "@/hooks/useAppToast";
import {
  ClockIcon,
  TimerIcon,
  CheckIcon,
  FlameIcon,
  CalendarIcon,
  UsersIcon,
  EditPencilIcon,
} from "@/components/shared/icons";

interface UserStats {
  /** Unique user identifier */
  id: string;
  /** User's display name */
  username: string | null;
  /** URL to user's avatar image */
  avatar_url: string | null;
  /** Whether the viewer is friends with this user */
  isFriend: boolean;
  /** User's productivity statistics (null values indicate hidden data) */
  stats: {
    total_sessions: number | null;
    completed_tasks: number | null;
    total_tasks: number | null;
    streak: number | null;
    total_focus_time: number | null;
    longest_streak: number | null;
    tasks_completed_today: number | null;
  } | null;
}

type FriendStatus = "none" | "pending" | "sent" | "friends";

interface StatCardConfig {
  label: string;
  value: number | null;
  icon: ComponentType<{ size?: number; className?: string }>;
  iconWrapClass: string;
  format: (value: number | null) => string;
}

export default function UserProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  const { actionSuccess, actionError } = useAppToast();

  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [friendStatus, setFriendStatus] = useState<FriendStatus>("none");

  const fetchUserStats = useCallback(async () => {
    try {
      const response = await fetch(API_DYNAMIC_ROUTES.USER_BY_ID(userId));
      if (!response.ok) {
        if (response.status === 404) {
          setError("User not found");
        } else {
          throw new Error("Failed to fetch user stats");
        }
        return;
      }

      const payload = (await response.json()) as { data?: UserStats };
      setUserStats(payload.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchFriendStatus = useCallback(async () => {
    try {
      const response = await fetch(API_ROUTES.FRIENDS);
      if (!response.ok) return;

      const responseData = await response.json();
      const friends = (responseData.data || []) as Array<{
        sender_id: string;
        receiver_id: string;
        status: "pending" | "accepted";
      }>;
      const currentUserId = session?.user?.id;

      const relation = friends.find(
        (f) => f.sender_id === userId || f.receiver_id === userId,
      );

      if (!relation) {
        setFriendStatus("none");
        return;
      }

      if (relation.status === "accepted") {
        setFriendStatus("friends");
      } else if (relation.sender_id === currentUserId) {
        setFriendStatus("sent");
      } else {
        setFriendStatus("pending");
      }
    } catch {
      // Keep default "none" status on failure
    }
  }, [session?.user?.id, userId]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push(ROUTES.SIGN_IN);
      return;
    }

    fetchUserStats();
    fetchFriendStatus();
  }, [session, status, router, fetchUserStats, fetchFriendStatus]);

  const handleSendFriendRequest = async () => {
    if (!userStats) return;

    setSendingRequest(true);
    try {
      const response = await fetch(API_ROUTES.FRIENDS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ receiver_id: userId }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as {
          error?: { message?: string };
        };
        throw new Error(
          errorData.error?.message || "Failed to send friend request",
        );
      }

      setFriendStatus("sent");
      actionSuccess("Friend request sent successfully.");
    } catch (err) {
      actionError(err, "Failed to send friend request.");
    } finally {
      setSendingRequest(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <MyLoader label="Loading user profile" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Card variant="outline">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-error/10 mx-auto mb-4 flex items-center justify-center">
              <UsersIcon size={32} className="text-error" />
            </div>
            <p className="text-error mb-4 text-lg">{error}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userStats) return null;

  const isOwnProfile = session?.user?.id === userStats?.id;

  const getSubtitle = () => {
    if (isOwnProfile) return "This is your profile";
    if (userStats.isFriend) return "Your friend";
    if (friendStatus === "pending") return "Wants to be your friend";
    return "Focusly member";
  };

  const statCards: StatCardConfig[] = userStats.stats
    ? [
        {
          label: "Total Focus Time",
          value: userStats.stats.total_focus_time,
          icon: ClockIcon,
          iconWrapClass: "bg-brand-primary/10 text-brand-primary",
          format: (v) =>
            v !== null ? DateTimeService.formatTime(v) : "Hidden",
        },
        {
          label: "Total Sessions",
          value: userStats.stats.total_sessions,
          icon: TimerIcon,
          iconWrapClass: "bg-brand-secondary/10 text-brand-secondary",
          format: (v) => (v !== null ? String(v) : "Hidden"),
        },
        {
          label: "Tasks Completed",
          value: userStats.stats.completed_tasks,
          icon: CheckIcon,
          iconWrapClass: "bg-brand-accent/10 text-brand-accent",
          format: (v) => (v !== null ? String(v) : "Hidden"),
        },
        {
          label: "Current Streak",
          value: userStats.stats.streak,
          icon: FlameIcon,
          iconWrapClass: "bg-purple/10 text-purple",
          format: (v) => (v !== null ? `${v} days` : "Hidden"),
        },
        {
          label: "Longest Streak",
          value: userStats.stats.longest_streak,
          icon: FlameIcon,
          iconWrapClass: "bg-info/10 text-info",
          format: (v) => (v !== null ? `${v} days` : "Hidden"),
        },
        {
          label: "Today's Tasks",
          value: userStats.stats.tasks_completed_today,
          icon: CalendarIcon,
          iconWrapClass: "bg-warning/10 text-warning",
          format: (v) => (v !== null ? String(v) : "Hidden"),
        },
      ]
    : [];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Profile header */}
      <Card className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
            {userStats.avatar_url ? (
              <Image
                src={userStats.avatar_url}
                alt={userStats.username || "User"}
                width={80}
                height={80}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <span className="text-3xl font-semibold">
                {(userStats.username || "Player").charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold truncate">
              {userStats.username || "Player"}
            </h1>
            <p className="text-muted-foreground mt-1">{getSubtitle()}</p>
          </div>

          <div className="shrink-0">
            {isOwnProfile ? (
              <LinkButton href={ROUTES.PROFILE} icon={EditPencilIcon}>
                Edit Profile
              </LinkButton>
            ) : friendStatus === "friends" ? (
              <Button disabled>Friends</Button>
            ) : friendStatus === "sent" ? (
              <Button disabled>Friend Request Sent</Button>
            ) : friendStatus === "pending" ? (
              <Button disabled>Request Pending</Button>
            ) : (
              <Button
                onClick={handleSendFriendRequest}
                disabled={sendingRequest}
              >
                {sendingRequest ? "Sending..." : "Send Friend Request"}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {!isOwnProfile && !userStats.isFriend ? (
        <Card variant="outline">
          <CardContent className="p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <UsersIcon size={32} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg">
              You must be friends with this person to see their stats.
            </p>
          </CardContent>
        </Card>
      ) : statCards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.label}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.06}s` }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.iconWrapClass}`}
                  >
                    <Icon size={24} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-primary truncate">
                      {stat.format(stat.value)}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card variant="outline">
          <CardContent className="p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <CalendarIcon size={32} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg">
              No stats available yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function LinkButton({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors cursor-pointer"
    >
      <Icon size={16} />
      {children}
    </Link>
  );
}
