/**
 * @fileoverview Home page for authenticated users.
 */

"use client";

import { useRef, useEffect, useMemo, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import TasksView from "@/app/(app)/tasks/_components/views/TasksView";
import QuickAddTask from "@/app/(app)/tasks/_components/forms/QuickAddTask";
import PomodoroTimer from "@/app/(app)/home/_components/pomodoro/PomodoroTimer";
import AchievementNotification from "@/app/(app)/home/_components/achievements/AchievementNotification";
import { HomeNotifications } from "@/app/(app)/home/_components/HomeNotifications";
import { TimerSettingsButton } from "@/app/(app)/home/_components/TimerSettingsButton";
import { useTasks } from "@/hooks/useTasks";
import { useCachedStats } from "@/hooks/useCachedStats";
import { useAchievements } from "@/hooks/useAchievements";
import { useTags } from "@/hooks/useTags";
import { useTaskNotifications } from "@/hooks/useTaskNotifications";
import { useNotificationsContext } from "@/components/providers/NotificationsProvider";
import { useSession } from "@/hooks/useAuth";
import { Task } from "@/types";
import type { PomodoroSession } from "@/types";
import { getAllImminentTasks } from "@/lib/utils/taskUtils";
import { ROUTES } from "@/constants";
import { MyLoader } from "@/components/shared/MyLoader";
import { AddPlusIcon } from "@/components/shared/icons";

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const taskInputRef = useRef<HTMLInputElement>(null);
  const [showAllUpcomingTasks, setShowAllUpcomingTasks] = useState(false);
  const [achievementCheckPending, setAchievementCheckPending] = useState(false);
  const [timerRef, setTimerRef] = useState<{
    start: () => void;
    pause: () => void;
    reset: () => void;
    skip: () => void;
    status: "idle" | "running" | "paused";
  } | null>(null);

  const {
    tasks,
    activeTaskId,
    loading,
    error,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    setActiveTask,
    incrementPomodoro,
    addSubTask,
    toggleSubTask,
    deleteSubTask,
    reorderTasks,
  } = useTasks();

  const {
    updateTaskStats,
    addSession,
    getTodayFocusTime,
    stats,
    refreshStats,
    invalidateCache,
  } = useCachedStats();
  const { tags } = useTags();
  const {
    newlyUnlocked,
    clearNewlyUnlocked,
    checkAchievements,
    checkTimeBasedAchievements,
  } = useAchievements();

  // Enable task notifications
  useTaskNotifications({
    tasks,
    enabled: typeof window !== "undefined" && session !== null,
  });

  const { notifications } = useNotificationsContext();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(ROUTES.SIGN_IN);
    }
  }, [status, router]);

  // useRef for frequently changing values (Pomodoro optimization)
  const statsRef = useRef(stats);
  const tasksRef = useRef(tasks);

  useEffect(() => {
    statsRef.current = stats;
    tasksRef.current = tasks;
  }, [stats, tasks]);

  // Update task stats
  useEffect(() => {
    const completedTasks = tasks.filter((task) => task.completed).length;
    updateTaskStats(tasks.length, completedTasks);
  }, [tasks, updateTaskStats]);

  // Achievement check with useRef to avoid repeated calls
  const prevStatsRef = useRef({
    totalSessions: 0,
    completedTasks: 0,
    streak: 0,
    todayFocusMinutes: 0,
  });

  const todayFocusMinutes = useMemo(
    () => Math.floor(getTodayFocusTime() / 60),
    [getTodayFocusTime],
  );

  const currentStats = useMemo(
    () => ({
      totalSessions: stats.totalSessions,
      completedTasks: stats.completedTasks,
      streak: stats.streak,
      todayFocusMinutes,
    }),
    [
      stats.totalSessions,
      stats.completedTasks,
      stats.streak,
      todayFocusMinutes,
    ],
  );

  useEffect(() => {
    const hasChanged =
      prevStatsRef.current.totalSessions !== currentStats.totalSessions ||
      prevStatsRef.current.completedTasks !== currentStats.completedTasks ||
      prevStatsRef.current.streak !== currentStats.streak ||
      prevStatsRef.current.todayFocusMinutes !== currentStats.todayFocusMinutes;

    if (hasChanged) {
      const tid = window.setTimeout(() => setAchievementCheckPending(true), 0);
      return () => clearTimeout(tid);
    }
  }, [currentStats]);

  // Debouncing/batching checkAchievements to avoid repeated calls
  useEffect(() => {
    if (achievementCheckPending) {
      const timer = setTimeout(async () => {
        checkAchievements(currentStats);
        setAchievementCheckPending(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [achievementCheckPending, checkAchievements, currentStats]);

  const triggerAchievementCheck = useCallback(() => {
    setAchievementCheckPending(true);
  }, []);

  // Task handlers
  const handleQuickAddTask = useCallback(
    (title: string) => {
      addTask({ title });
    },
    [addTask],
  );

  const handleCreateTask = useCallback(() => {
    router.push(ROUTES.CREATE_TASK);
  }, [router]);

  const handleEditTask = useCallback(
    (task: Task) => {
      router.push(`/task/${task.id}`);
    },
    [router],
  );

  const handlePomodoroComplete = useCallback(
    (taskId: string) => {
      incrementPomodoro(taskId);
      const hour = new Date().getHours();
      checkTimeBasedAchievements(hour);
    },
    [incrementPomodoro, checkTimeBasedAchievements],
  );

  const handleSessionComplete = useCallback(
    async (pomodoroSession: PomodoroSession) => {
      await addSession(pomodoroSession);
      if (invalidateCache) invalidateCache();
      if (refreshStats) await refreshStats();
      triggerAchievementCheck();
    },
    [addSession, invalidateCache, refreshStats, triggerAchievementCheck],
  );

  // Memoize expensive computations
  const allImminentTasks = useMemo(() => getAllImminentTasks(tasks), [tasks]);
  const displayedTasks = useMemo(
    () =>
      showAllUpcomingTasks ? allImminentTasks : allImminentTasks.slice(0, 5),
    [allImminentTasks, showAllUpcomingTasks],
  );
  const hasMoreTasksThanDisplayed = allImminentTasks.length > 5;

  // Timer keyboard shortcuts (Space, R, S, N) — kept, but handled locally
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case " ":
          event.preventDefault();
          if (timerRef) {
            if (timerRef.status === "running") {
              timerRef.pause();
            } else {
              timerRef.start();
            }
          }
          break;
        case "r":
          if (timerRef) timerRef.reset();
          break;
        case "s":
          if (timerRef) timerRef.skip();
          break;
        case "n":
          taskInputRef.current?.focus();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [timerRef]);

  const pomodoroCardContent = (
    <>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Pomodoro Timer</CardTitle>
          <TimerSettingsButton />
        </div>
      </CardHeader>
      <CardContent>
        <PomodoroTimer
          activeTaskId={activeTaskId}
          tasks={tasks}
          onSelectTask={setActiveTask}
          onSessionComplete={handleSessionComplete}
          onPomodoroComplete={handlePomodoroComplete}
          onTimerRefReady={setTimerRef}
        />
      </CardContent>
    </>
  );

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <MyLoader label="Loading" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <Card variant="elevated" className="rounded-bl-lg rounded-br-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tasks</CardTitle>
                <Button
                  onClick={handleCreateTask}
                  size="sm"
                  className="flex items-center"
                >
                  <AddPlusIcon />
                  New Task
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <QuickAddTask onAdd={handleQuickAddTask} />

                <TasksView
                  tasks={displayedTasks}
                  activeTaskId={activeTaskId}
                  tags={tags}
                  loading={loading}
                  error={error}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                  onSelectTask={setActiveTask}
                  onUpdate={updateTask}
                  onAddSubTask={addSubTask}
                  onToggleSubTask={toggleSubTask}
                  onDeleteSubTask={deleteSubTask}
                  onReorder={reorderTasks}
                  onEditTask={handleEditTask}
                  showSortOptions={false}
                />
                {hasMoreTasksThanDisplayed && (
                  <div className="text-center">
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setShowAllUpcomingTasks(!showAllUpcomingTasks)
                      }
                      className="text-sm"
                    >
                      {showAllUpcomingTasks
                        ? "View less"
                        : `View ${allImminentTasks.length - 5} more task${allImminentTasks.length - 5 > 1 ? "s" : ""}`}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {notifications.length > 0 && <HomeNotifications />}
        </div>

        <div className="self-start lg:sticky lg:top-24">
          <Card variant="elevated" className="rounded-bl-lg rounded-br-lg">
            {pomodoroCardContent}
          </Card>
        </div>
      </div>

      {/* Achievement Notifications */}
      {newlyUnlocked.map((achievement, index) => (
        <AchievementNotification
          key={`${achievement.id}-${index}`}
          achievement={achievement}
          onClose={() => {
            if (index === newlyUnlocked.length - 1) {
              clearNewlyUnlocked();
            }
          }}
        />
      ))}
    </div>
  );
}
