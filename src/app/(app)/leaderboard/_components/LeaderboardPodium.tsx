import { DateTimeService } from "@/lib/domain/services/DateTimeService";
/**
 * @fileoverview Leaderboard podium component for top 3 users
 */

'use client';

import Image from 'next/image';
import Card, { CardContent } from '@/components/ui/Card';
import { LeaderboardUser } from '@/types/leaderboard';

interface LeaderboardPodiumProps {
  leaderboard: LeaderboardUser[];
  selectedTab: 'tasks' | 'time' | 'streak';
  formatTime: (seconds: number) => string;
}

export function LeaderboardPodium({ leaderboard, selectedTab, formatTime }: LeaderboardPodiumProps) {
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return null;
    }
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0: return 'from-yellow-400 to-yellow-600';
      case 1: return 'from-gray-300 to-gray-500';
      case 2: return 'from-amber-600 to-amber-800';
      default: return 'from-primary/20 to-primary/10';
    }
  };

  const getDisplayValue = (user: LeaderboardUser) => {
    switch (selectedTab) {
      case 'tasks': return user.stats?.completed_tasks || 0;
      case 'time': return DateTimeService.formatTime(user.stats?.total_focus_time || 0);
      case 'streak': return `${user.stats?.streak || 0}`;
      default: return 0;
    }
  };

  const getLabel = () => {
    switch (selectedTab) {
      case 'tasks': return 'tasks';
      case 'time': return 'focused';
      case 'streak': return 'day streak';
      default: return '';
    }
  };

  if (leaderboard.length < 3) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-4xl mx-auto">
      {/* Second Place */}
      <div className="flex flex-col items-center md:order-1 md:mt-8">
        <Card variant="elevated" className="w-full overflow-hidden">
          <div className={`h-2 bg-linear-to-r ${getRankColor(1)}`}></div>
          <CardContent className="pt-6 pb-4 text-center">
            <div className="text-4xl mb-2">{getRankIcon(1)}</div>
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-linear-to-r from-gray-300 to-gray-500 p-1">
              <Image
                src={leaderboard[1].avatar_url || '/default-avatar.svg'}
                alt={leaderboard[1].username || 'Player'}
                width={64}
                height={64}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <p className="font-bold text-sm mb-1">{leaderboard[1].username || 'Player'}</p>
            <p className="text-2xl font-bold text-primary mb-1">{getDisplayValue(leaderboard[1])}</p>
            <p className="text-xs text-muted-foreground">{getLabel()}</p>
          </CardContent>
        </Card>
      </div>

      {/* First Place */}
      <div className="flex flex-col items-center md:order-0 col-span-1">
        <Card variant="elevated" className="w-full overflow-hidden md:transform md:scale-110">
          <div className={`h-2 bg-linear-to-r ${getRankColor(0)}`}></div>
          <CardContent className="pt-6 pb-4 text-center">
            <div className="text-5xl mb-2">{getRankIcon(0)}</div>
            <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-linear-to-r from-yellow-400 to-yellow-600 p-1">
              <Image
                src={leaderboard[0].avatar_url || '/default-avatar.svg'}
                alt={leaderboard[0].username || 'Player'}
                width={80}
                height={80}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <p className="font-bold mb-1">{leaderboard[0].username || 'Player'}</p>
            <p className="text-3xl font-bold text-primary mb-1">{getDisplayValue(leaderboard[0])}</p>
            <p className="text-sm text-muted-foreground">{getLabel()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Third Place */}
      <div className="flex flex-col items-center md:order-2 md:mt-12">
        <Card variant="elevated" className="w-full overflow-hidden">
          <div className={`h-2 bg-linear-to-r ${getRankColor(2)}`}></div>
          <CardContent className="pt-6 pb-4 text-center">
            <div className="text-4xl mb-2">{getRankIcon(2)}</div>
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-linear-to-r from-amber-600 to-amber-800 p-1">
              <Image
                src={leaderboard[2].avatar_url || '/default-avatar.svg'}
                alt={leaderboard[2].username || 'Player'}
                width={64}
                height={64}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <p className="font-bold text-sm mb-1">{leaderboard[2].username || 'Player'}</p>
            <p className="text-2xl font-bold text-primary mb-1">{getDisplayValue(leaderboard[2])}</p>
            <p className="text-xs text-muted-foreground">{getLabel()}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
