"use client";

import { type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import Card, { CardContent } from "@/components/ui/Card";
import { DYNAMIC_ROUTES } from "@/constants";
import { DateTimeService } from "@/lib/domain/services/DateTimeService";
import { type LeaderboardUser } from "@/types/leaderboard";

type LeaderboardTab = "tasks" | "time" | "streak";

interface LeaderboardPodiumProps {
  leaderboard: LeaderboardUser[];
  selectedTab: LeaderboardTab;
}

interface RankStyle {
  icon: string;
  gradient: string;
  avatarClasses: string;
  avatarSize: number;
  iconClasses: string;
  usernameClasses: string;
  valueClasses: string;
  wrapperClasses: string;
  cardClasses: string;
}

interface TabStyle {
  label: string;
  getDisplayValue: (user: LeaderboardUser) => ReactNode;
}

const RANK_STYLES: readonly RankStyle[] = [
  {
    icon: "🥇",
    gradient: "from-yellow-400 to-yellow-600",
    avatarClasses: "w-16 h-16 sm:w-20 sm:h-20",
    avatarSize: 80,
    iconClasses: "text-4xl sm:text-5xl",
    usernameClasses: "text-sm sm:text-base",
    valueClasses: "text-2xl sm:text-3xl",
    wrapperClasses: "flex flex-col items-center col-span-1",
    cardClasses: "sm:transform sm:scale-110",
  },
  {
    icon: "🥈",
    gradient: "from-gray-300 to-gray-500",
    avatarClasses: "w-14 h-14 sm:w-16 sm:h-16",
    avatarSize: 64,
    iconClasses: "text-3xl sm:text-4xl",
    usernameClasses: "text-sm",
    valueClasses: "text-xl sm:text-2xl",
    wrapperClasses: "flex flex-col items-center md:order-1 md:mt-8 col-span-1",
    cardClasses: "",
  },
  {
    icon: "🥉",
    gradient: "from-amber-600 to-amber-800",
    avatarClasses: "w-14 h-14 sm:w-16 sm:h-16",
    avatarSize: 64,
    iconClasses: "text-3xl sm:text-4xl",
    usernameClasses: "text-sm",
    valueClasses: "text-xl sm:text-2xl",
    wrapperClasses: "flex flex-col items-center md:order-2 md:mt-12 col-span-1",
    cardClasses: "",
  },
];

const TAB_STYLES: Record<LeaderboardTab, TabStyle> = {
  tasks: {
    label: "tasks",
    getDisplayValue: (user) => user.stats?.completed_tasks ?? 0,
  },
  time: {
    label: "focused",
    getDisplayValue: (user) =>
      DateTimeService.formatTime(user.stats?.total_focus_time ?? 0),
  },
  streak: {
    label: "day streak",
    getDisplayValue: (user) => `${user.stats?.streak ?? 0}`,
  },
};

interface PodiumCardProps {
  user: LeaderboardUser;
  rank: number;
  selectedTab: LeaderboardTab;
}

function PodiumCard({ user, rank, selectedTab }: PodiumCardProps) {
  const rankStyle = RANK_STYLES[rank];
  const tabStyle = TAB_STYLES[selectedTab];

  if (!rankStyle) return null;

  const displayName = user.username ?? "Player";

  return (
    <div className={rankStyle.wrapperClasses}>
      <Link
        href={DYNAMIC_ROUTES.USER_PROFILE(user.id)}
        aria-label={`View ${displayName}'s profile`}
        className="w-full"
      >
        <Card
          variant="elevated"
          className={`w-full overflow-hidden ${rankStyle.cardClasses} transition-transform hover:scale-[1.02]`}
        >
          <div className={`h-2 bg-linear-to-r ${rankStyle.gradient}`} />
          <CardContent className="pt-6 pb-4 text-center">
            <div className={`${rankStyle.iconClasses} mb-2`}>
              {rankStyle.icon}
            </div>
            <div
              className={`mx-auto mb-3 rounded-full bg-linear-to-r p-1 ${rankStyle.gradient} ${rankStyle.avatarClasses}`}
            >
              <Image
                src={user.avatar_url ?? "/default-avatar.svg"}
                alt={displayName}
                width={rankStyle.avatarSize}
                height={rankStyle.avatarSize}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <p className={`font-bold mb-1 ${rankStyle.usernameClasses}`}>
              {displayName}
            </p>
            <p
              className={`font-bold text-primary mb-1 ${rankStyle.valueClasses}`}
            >
              {tabStyle.getDisplayValue(user)}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {tabStyle.label}
            </p>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

export function LeaderboardPodium({
  leaderboard,
  selectedTab,
}: LeaderboardPodiumProps) {
  const topThree = leaderboard.slice(0, RANK_STYLES.length);

  if (topThree.length < RANK_STYLES.length) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8 max-w-4xl mx-auto">
      {topThree.map((user, rank) => (
        <PodiumCard
          key={user.id}
          user={user}
          rank={rank}
          selectedTab={selectedTab}
        />
      ))}
    </div>
  );
}
