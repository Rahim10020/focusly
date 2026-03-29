/**
 * @fileoverview Dashboard component for authenticated users.
 */

"use client";

import { useRef, useEffect, useMemo, useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import TasksView from "@/app/(app)/tasks/_components/views/TasksView";
import QuickAddTask from "@/app/(app)/tasks/_components/forms/QuickAddTask";
import PomodoroTimer from "@/app/(app)/dashboard/_components/pomodoro/PomodoroTimer";
import AchievementNotification from "@/app/(app)/dashboard/_components/achievements/AchievementNotification";
import { DashboardNotifications } from "@/app/(app)/dashboard/_components/DashboardNotifications";
import { FocusModeToggle } from "@/app/(app)/dashboard/_components/FocusModeToggle";
import { KeyboardShortcutHint } from "@/app/(app)/dashboard/_components/KeyboardShortcutHint";
import { TimerSettingsButton } from "@/app/(app)/dashboard/_components/TimerSettingsButton";

// Lazy load heavy or conditional components
const KeyboardShortcutsModal = dynamic(
  () => import("@/components/shared/KeyboardShortcutsModal"),
  { ssr: false },
);
import { useTasks } from "@/hooks/useTasks";
import { useCachedStats } from "@/hooks/useCachedStats";
import { useAchievements } from "@/hooks/useAchievements";
import { useTags } from "@/hooks/useTags";
import {
  useKeyboardShortcuts,
  GLOBAL_SHORTCUTS,
} from "@/hooks/useKeyboardShortcuts";
import { useTaskNotifications } from "@/hooks/useTaskNotifications";
import { useNotificationsContext } from "@/components/providers/NotificationsProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Task } from "@/types";
import type { PomodoroSession } from "@/types";
import { getAllImminentTasks } from "@/lib/utils/taskUtils";
import { ROUTES } from "@/constants";
import { AddPlusIcon } from "@/components/shared/icons";

interface DashboardProps {
  session: {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  } | null;
}

export function Dashboard({ session }: DashboardProps) {
  const router = useRouter();
  const taskInputRef = useRef<HTMLInputElement>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
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
        await checkAchievements(currentStats);
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

  useTheme();

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...GLOBAL_SHORTCUTS.START_PAUSE_TIMER,
      action: () => {
        if (timerRef) {
          if (timerRef.status === "running") {
            timerRef.pause();
          } else {
            timerRef.start();
          }
        }
      },
    },
    {
      ...GLOBAL_SHORTCUTS.RESET_TIMER,
      action: () => {
        if (timerRef) timerRef.reset();
      },
    },
    {
      ...GLOBAL_SHORTCUTS.SKIP_SESSION,
      action: () => {
        if (timerRef) timerRef.skip();
      },
    },
    {
      ...GLOBAL_SHORTCUTS.NEW_TASK,
      action: () => {
        taskInputRef.current?.focus();
      },
    },
    {
      ...GLOBAL_SHORTCUTS.SHOW_SHORTCUTS,
      action: () => setShowShortcuts(true),
    },
    {
      key: "f",
      description: "Toggle Focus Mode",
      action: () => setFocusMode(!focusMode),
    },
  ]);

  return (
    <div
      className={`min-h-screen bg-background ${focusMode ? "focus-mode" : ""}`}
    >
      {!focusMode && <Header />}

      <main
        className={`max-w-6xl mx-auto px-6 py-8 space-y-6 ${focusMode ? "focus-mode-container" : ""}`}
      >
        {/* Tasks Section - Full Width */}
        {!focusMode && (
          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tasks</CardTitle>
                <Button
                  onClick={handleCreateTask}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <AddPlusIcon size={16} />
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
                        ? "Voir moins"
                        : `Voir ${allImminentTasks.length - 5} tâche${allImminentTasks.length - 5 > 1 ? "s" : ""} de plus`}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pomodoro Timer */}
        <Card
          variant="elevated"
          className={focusMode ? "focus-mode-timer" : ""}
        >
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
        </Card>

        {/* Notifications */}
        {!focusMode && notifications.length > 0 && <DashboardNotifications />}
      </main>

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

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}

      {/* Focus Mode Toggle Button */}
      <FocusModeToggle
        isFocusMode={focusMode}
        onToggle={() => setFocusMode(!focusMode)}
      />

      {/* Keyboard shortcut hint */}
      {!focusMode && (
        <KeyboardShortcutHint onClick={() => setShowShortcuts(true)} />
      )}
    </div>
  );
}
