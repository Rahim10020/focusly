/**
 * @fileoverview Profile statistics grid component displaying key user metrics.
 */

"use client";

import Card, { CardContent } from "@/components/ui/Card";

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
  const stats = [
    { label: "Total Sessions", value: totalSessions },
    { label: "Tasks Completed", value: completedTasks },
    { label: "Total Focus Time", value: `${totalFocusHours}h` },
    { label: "Day Streak", value: currentStreak },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => (
        <Card key={stat.label} variant="outline">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
