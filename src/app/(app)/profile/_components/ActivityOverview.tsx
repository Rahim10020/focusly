/**
 * @fileoverview Activity overview component displaying user performance metrics.
 */

"use client";

import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

interface ActivityOverviewProps {
  completionRate: number;
  longestStreak: number;
  activeTasks: number;
}

export function ActivityOverview({
  completionRate,
  longestStreak,
  activeTasks,
}: ActivityOverviewProps) {
  const items = [
    {
      label: "Completion Rate",
      sublabel: "of tasks",
      value: `${completionRate}%`,
    },
    {
      label: "Longest Streak",
      sublabel: "best performance",
      value: `${longestStreak} days`,
    },
    { label: "Active Tasks", sublabel: "in progress", value: activeTasks },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border mt-12">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
            >
              <div>
                <p className="font-normal text-xl">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.sublabel}</p>
              </div>
              <p className="text-lg font-semibold">{item.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
