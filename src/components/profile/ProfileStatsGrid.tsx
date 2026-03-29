/**
 * @fileoverview Profile statistics grid component displaying key user metrics.
 * @module components/profile/ProfileStatsGrid
 */

"use client";

import Card, { CardContent } from "@/components/ui/Card";
import { CircleIcon, ClockIcon } from "@/components/shared/icons";
import CheckIcon from "@/components/shared/icons/CheckIcon";

interface ProfileStatsGridProps {
  totalSessions: number;
  completedTasks: number;
  totalFocusHours: number;
  currentStreak: number;
}

export function ProfileStatsGrid({
  totalSessions,
  completedTasks,
  totalFocusHours,
  currentStreak,
}: ProfileStatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card variant="default">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center">
              <CircleIcon className="text-primary" />
            </div>
            <p className="text-3xl font-bold mb-1">{totalSessions}</p>
            <p className="text-sm text-muted-foreground">Total Sessions</p>
          </div>
        </CardContent>
      </Card>

      <Card variant="default">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center">
              <CheckIcon className="text-green-500" />
            </div>
            <p className="text-3xl font-bold mb-1">{completedTasks}</p>
            <p className="text-sm text-muted-foreground">Tasks Completed</p>
          </div>
        </CardContent>
      </Card>

      <Card variant="default">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center">
              <ClockIcon className="text-amber-500" />
            </div>
            <p className="text-3xl font-bold mb-1">{totalFocusHours}h</p>
            <p className="text-sm text-muted-foreground">Total Focus Time</p>
          </div>
        </CardContent>
      </Card>

      <Card variant="default">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center">
              {/* A changer apres quand j'aurai une meilleure icone */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-red-500"
              >
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
              </svg>
            </div>
            <p className="text-3xl font-bold mb-1">{currentStreak}</p>
            <p className="text-sm text-muted-foreground">Day Streak</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
