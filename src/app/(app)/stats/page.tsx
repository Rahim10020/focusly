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
import { StatsService } from "@/lib/domain/services/StatsService";
import { ChevronDown } from "lucide-react";
import { useState, useMemo, useEffect, useRef, useId } from "react";
import { MyLoader } from "@/components/shared/MyLoader";

type StatsTab = "achievements" | "tasks" | "domains";

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
  const [activeTab, setActiveTab] = useState<StatsTab>("achievements");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuId = useId();

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
  const tabs: { id: StatsTab; label: string; count?: number }[] = [
    {
      id: "achievements",
      label: "Achievements",
      count: unlockedAchievements.length,
    },
    { id: "tasks", label: "Tasks", count: totalVisibleTasks },
    { id: "domains", label: "Domains" },
  ];
  const activeTabDetails = tabs.find((tab) => tab.id === activeTab)!;

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };

    const mobileBreakpoint = window.matchMedia("(max-width: 767px)");
    const closeOnDesktop = () => {
      if (!mobileBreakpoint.matches) setIsMobileMenuOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    mobileBreakpoint.addEventListener("change", closeOnDesktop);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      mobileBreakpoint.removeEventListener("change", closeOnDesktop);
    };
  }, []);

  const selectTab = (tab: StatsTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Statistics</h1>
        <p className="text-muted-foreground text-lg font-normal">
          Track your productivity and progress
        </p>
      </div>
      <div className="space-y-8">
        {/* Mobile section selector */}
        <div className="relative md:hidden" ref={mobileMenuRef}>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
            aria-expanded={isMobileMenuOpen}
            aria-controls={mobileMenuId}
            className="flex w-full items-center justify-between rounded-md border border-border bg-background px-4 py-3 font-medium text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <span className="flex items-center gap-2">
              {activeTabDetails.label}
              {activeTabDetails.count !== undefined && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-white">
                  {activeTabDetails.count}
                </span>
              )}
            </span>
            <ChevronDown
              aria-hidden="true"
              className={`h-5 w-5 transition-transform ${isMobileMenuOpen ? "rotate-180" : ""}`}
            />
          </button>
          {isMobileMenuOpen && (
            <div
              id={mobileMenuId}
              role="menu"
              aria-label="Statistics sections"
              className="absolute z-20 mt-2 w-full overflow-hidden rounded-md border border-border bg-background py-1 shadow-lg"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={activeTab === tab.id}
                  onClick={() => selectTab(tab.id)}
                  className={`flex w-full items-center justify-between px-4 py-3 text-left font-medium transition-colors hover:bg-muted focus:bg-muted focus:outline-none ${
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary"
                      : "text-foreground"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-white">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop tabs */}
        <div className="hidden gap-24 md:flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => selectTab(tab.id)}
              className={`relative cursor-pointer px-4 py-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
              {tab.count !== undefined && (
                <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-white">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
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
                  placeholder="Search in completed tasks..."
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
                  placeholder="Search in ongoing tasks..."
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
                  placeholder="Search in upcoming tasks..."
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
                    placeholder="Search in failed tasks..."
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
                    <TaskHistoryList
                      tasks={filteredFailedTasks}
                      type="failed"
                    />
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
                    placeholder="Search in overdue tasks..."
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
    </div>
  );
}
