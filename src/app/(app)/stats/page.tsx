/**
 * @fileoverview Statistics page for the Focusly application.
 * Displays productivity statistics, achievements, task history, and domain breakdown
 * with tabbed navigation for different data views.
 * @module app/stats/page
 */

"use client";

import dynamic from "next/dynamic";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useAchievements } from "@/hooks/useAchievements";
import { useTasks } from "@/hooks/useTasks";
import { useStats } from "@/hooks/useStats";
import { StatsService } from "@/lib/domain/services/StatsService";
import { useState, useMemo } from "react";
import { MyLoader } from "@/components/shared/MyLoader";
import StatsCard from "@/app/(app)/stats/_components/StatsCard";

const AchievementsList = dynamic(
  () => import("@/app/(app)/home/_components/achievements/AchievementsList"),
  {
    ssr: false,
    loading: () => <MyLoader label="Loading" />,
  },
);

const TaskHistoryList = dynamic(
  () =>
    import("@/app/(app)/stats/_components/TaskHistoryList").then((mod) => ({
      default: mod.TaskHistoryList,
    })),
  {
    ssr: false,
    loading: () => <MyLoader label="Loading" />,
  },
);

const DomainStats = dynamic(
  () => import("@/app/(app)/stats/_components/DomainStats"),
  {
    ssr: false,
    loading: () => <MyLoader label="Loading" />,
  },
);

export default function StatsPage() {
  const { unlockedAchievements, lockedAchievements } = useAchievements();
  const { tasks } = useTasks();
  const { sessions } = useStats();
  const [activeTab, setActiveTab] = useState<
    "achievements" | "tasks" | "domains"
  >("achievements");

  // États de recherche pour chaque section de tâches
  const [completedSearch, setCompletedSearch] = useState("");
  const [inProgressSearch, setInProgressSearch] = useState("");
  const [upcomingSearch, setUpcomingSearch] = useState("");
  const [failedSearch, setFailedSearch] = useState("");
  const [overdueSearch, setOverdueSearch] = useState("");

  const categorizedTasks = useMemo(
    () => StatsService.categorizeTasks(tasks),
    [tasks],
  );
  const taskStats = useMemo(
    () => StatsService.calculateTaskStats(tasks),
    [tasks],
  );

  const { completedTasks, failedTasks } = useMemo(() => {
    return {
      completedTasks: categorizedTasks.completed,
      failedTasks: categorizedTasks.failed,
    };
  }, [categorizedTasks]);

  // Fonction pour filtrer les tâches par titre
  const filterTasks = (tasks: any[], searchText: string) => {
    if (!searchText.trim()) return tasks;
    return tasks.filter((task) =>
      task.title.toLowerCase().includes(searchText.toLowerCase()),
    );
  };

  // Tâches filtrées pour chaque section
  const filteredCompletedTasks = useMemo(
    () => filterTasks(completedTasks, completedSearch),
    [completedTasks, completedSearch],
  );

  const filteredInProgressTasks = useMemo(
    () => filterTasks(categorizedTasks.inProgress, inProgressSearch),
    [categorizedTasks.inProgress, inProgressSearch],
  );

  const filteredUpcomingTasks = useMemo(
    () => filterTasks(categorizedTasks.upcoming, upcomingSearch),
    [categorizedTasks.upcoming, upcomingSearch],
  );

  const filteredFailedTasks = useMemo(
    () => filterTasks(failedTasks, failedSearch),
    [failedTasks, failedSearch],
  );

  const filteredOverdueTasks = useMemo(
    () => filterTasks(categorizedTasks.overdue, overdueSearch),
    [categorizedTasks.overdue, overdueSearch],
  );

  const totalVisibleTasks = taskStats.totalVisible;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Statistics</h1>
        <p className="text-muted-foreground">
          Track your productivity and progress
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-24 border-b border-border">
        <button
          onClick={() => setActiveTab("achievements")}
          className={`px-4 py-2 cursor-pointer font-medium transition-colors relative ${
            activeTab === "achievements"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Achievements
          {activeTab === "achievements" && (
            <div className="absolute bottom-0 left-0 right-8 md:right-0 h-0.5 bg-primary" />
          )}
          <span className="ml-1 px-1 md:ml-2 md:px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
            {unlockedAchievements.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("tasks")}
          className={`px-4 py-2 cursor-pointer font-medium transition-colors relative ${
            activeTab === "tasks"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Tasks
          {activeTab === "tasks" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
          <span className="ml-1 px-1 md:ml-2 md:px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
            {totalVisibleTasks}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("domains")}
          className={`px-4 py-2 cursor-pointer font-medium transition-colors relative ${
            activeTab === "domains"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Domains
          {activeTab === "domains" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      {activeTab === "achievements" && (
        <Card>
          <CardHeader>
            <div className="flex items-center  space-x-8 justify-between">
              <CardTitle>Achievements</CardTitle>
              <div className="text-sm text-muted-foreground">
                {unlockedAchievements.length} /{" "}
                {unlockedAchievements.length + lockedAchievements.length}{" "}
                unlocked
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <AchievementsList
              unlockedAchievements={unlockedAchievements}
              lockedAchievements={lockedAchievements}
            />
          </CardContent>
        </Card>
      )}

      {activeTab === "tasks" && (
        <div className="space-y-6">
          {/* Task Statistics Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatsCard
                  title="Completion Rate"
                  value={`${taskStats.completionRate.toFixed(1)}%`}
                />
                <StatsCard title="Postponed" value={taskStats.postponed} />
                <StatsCard title="Overdue" value={taskStats.overdue} />
                <StatsCard
                  title="Failure Rate"
                  value={`${taskStats.failureRate.toFixed(1)}%`}
                />
              </div>
            </CardContent>
          </Card>

          {/* Completed Tasks */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-8 justify-between">
                <CardTitle>Completed Tasks</CardTitle>
                <div className="text-sm text-muted-foreground">
                  {filteredCompletedTasks.length} task(s) completed
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="text"
                placeholder="Rechercher dans les tâches complétées..."
                value={completedSearch}
                onChange={(e) => setCompletedSearch(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div
                className={
                  filteredCompletedTasks.length > 5
                    ? "max-h-96 overflow-y-auto"
                    : ""
                }
              >
                <TaskHistoryList
                  tasks={filteredCompletedTasks}
                  type="completed"
                />
              </div>
            </CardContent>
          </Card>

          {/* In-Progress Tasks */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-8 justify-between">
                <CardTitle>In-Progress Tasks</CardTitle>
                <div className="text-sm text-muted-foreground">
                  {filteredInProgressTasks.length} in progress
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="text"
                placeholder="Rechercher dans les tâches en cours..."
                value={inProgressSearch}
                onChange={(e) => setInProgressSearch(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div
                className={
                  filteredInProgressTasks.length > 5
                    ? "max-h-96 overflow-y-auto"
                    : ""
                }
              >
                <TaskHistoryList
                  tasks={filteredInProgressTasks}
                  type="in-progress"
                />
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Tasks */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-8 justify-between">
                <CardTitle>Upcoming Tasks</CardTitle>
                <div className="text-sm text-muted-foreground">
                  {filteredUpcomingTasks.length} upcoming
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="text"
                placeholder="Rechercher dans les tâches à venir..."
                value={upcomingSearch}
                onChange={(e) => setUpcomingSearch(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div
                className={
                  filteredUpcomingTasks.length > 5
                    ? "max-h-96 overflow-y-auto"
                    : ""
                }
              >
                <TaskHistoryList
                  tasks={filteredUpcomingTasks}
                  type="upcoming"
                />
              </div>
            </CardContent>
          </Card>

          {/* Failed Tasks */}
          {failedTasks.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-8 justify-between">
                  <CardTitle>Failed Tasks</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    {filteredFailedTasks.length} task(s) not completed
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  type="text"
                  placeholder="Rechercher dans les tâches échouées..."
                  value={failedSearch}
                  onChange={(e) => setFailedSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div
                  className={
                    filteredFailedTasks.length > 5
                      ? "max-h-96 overflow-y-auto"
                      : ""
                  }
                >
                  <TaskHistoryList tasks={filteredFailedTasks} type="failed" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Overdue Tasks */}
          {categorizedTasks.overdue.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-8 justify-between">
                  <CardTitle>Overdue Tasks</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    {filteredOverdueTasks.length} task(s) overdue
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  type="text"
                  placeholder="Rechercher dans les tâches en retard..."
                  value={overdueSearch}
                  onChange={(e) => setOverdueSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div
                  className={
                    filteredOverdueTasks.length > 5
                      ? "max-h-96 overflow-y-auto"
                      : ""
                  }
                >
                  <TaskHistoryList tasks={filteredOverdueTasks} type="all" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "domains" && <DomainStats tasks={tasks} />}
    </div>
  );
}
