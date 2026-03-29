/**
 * @fileoverview Activity overview component displaying user performance metrics.
 * @module components/profile/ActivityOverview
 */

"use client";

import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { CircleIcon } from "@/components/shared/icons";
import CheckIcon from "@/components/shared/icons/CheckIcon";

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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center">
                <CircleIcon size={20} className="text-primary" />
              </div>
              <div>
                <p className="font-medium">Completion Rate</p>
                <p className="text-sm text-muted-foreground">
                  {completionRate}% of tasks
                </p>
              </div>
            </div>
            <div className="text-2xl font-bold">{completionRate}%</div>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center">
                <CheckIcon size={20} className="text-green-500" />
              </div>
              <div>
                <p className="font-medium">Longest Streak</p>
                <p className="text-sm text-muted-foreground">
                  Best performance
                </p>
              </div>
            </div>
            <div className="text-2xl font-bold">{longestStreak} days</div>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center">
                <CircleIcon size={20} className="text-amber-500" />
              </div>
              <div>
                <p className="font-medium">Active Tasks</p>
                <p className="text-sm text-muted-foreground">In progress</p>
              </div>
            </div>
            <div className="text-2xl font-bold">{activeTasks}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
