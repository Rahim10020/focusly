/**
 * @fileoverview Dashboard component for authenticated users.
 */

'use client';

import { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import TasksView from '@/components/tasks/TasksView';
import QuickAddTask from '@/components/tasks/QuickAddTask';
import PomodoroTimer from '@/components/pomodoro/PomodoroTimer';
import AchievementNotification from '@/components/achievements/AchievementNotification';
import KeyboardShortcutsModal from '@/components/ui/KeyboardShortcutsModal';
import { useTasks } from '@/lib/hooks/useTasks';
import { useCachedStats } from '@/lib/hooks/useCachedStats';
import { useAchievements } from '@/lib/hooks/useAchievements';
import { useTags } from '@/lib/hooks/useTags';
import { useKeyboardShortcuts, GLOBAL_SHORTCUTS } from '@/lib/hooks/useKeyboardShortcuts';
import { useTaskNotifications } from '@/lib/hooks/useTaskNotifications';
import { useNotificationsContext } from '@/components/providers/NotificationsProvider';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Task } from '@/types';
import type { PomodoroSession } from '@/types';
import { getAllImminentTasks } from '@/lib/utils/taskUtils';

interface DashboardProps {
  session: { user: { id: string; name?: string | null; email?: string | null; image?: string | null } } | null;
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
    status: 'idle' | 'running' | 'paused';
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

  const { updateTaskStats, addSession, getTodayFocusTime, stats, refreshStats, invalidateCache } = useCachedStats();
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
    enabled: typeof window !== 'undefined' && session !== null,
  });

  const { notifications, markAsRead } = useNotificationsContext();

  // useRef for frequently changing values (Pomodoro optimization)
  const statsRef = useRef(stats);
  const tasksRef = useRef(tasks);

  useEffect(() => {
    statsRef.current = stats;
    tasksRef.current = tasks;
  }, [stats, tasks]);

  // Update task stats
  useEffect(() => {
    const completedTasks = tasks.filter(task => task.completed).length;
    updateTaskStats(tasks.length, completedTasks);
  }, [tasks, updateTaskStats]);

  // Achievement check with useRef to avoid repeated calls
  const prevStatsRef = useRef({
    totalSessions: 0,
    completedTasks: 0,
    streak: 0,
    todayFocusMinutes: 0,
  });

  const todayFocusMinutes = useMemo(() =>
    Math.floor(getTodayFocusTime() / 60),
    [getTodayFocusTime]
  );

  const currentStats = useMemo(() => ({
    totalSessions: stats.totalSessions,
    completedTasks: stats.completedTasks,
    streak: stats.streak,
    todayFocusMinutes,
  }), [
    stats.totalSessions,
    stats.completedTasks,
    stats.streak,
    todayFocusMinutes
  ]);

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
  const handleQuickAddTask = useCallback((title: string) => {
    addTask({ title });
  }, [addTask]);

  const handleCreateTask = useCallback(() => {
    router.push('/create-task');
  }, [router]);

  const handleEditTask = useCallback((task: Task) => {
    router.push(`/task/${task.id}`);
  }, [router]);

  const handlePomodoroComplete = useCallback((taskId: string) => {
    incrementPomodoro(taskId);
    const hour = new Date().getHours();
    checkTimeBasedAchievements(hour);
  }, [incrementPomodoro, checkTimeBasedAchievements]);

  const handleSessionComplete = useCallback(async (pomodoroSession: PomodoroSession) => {
    await addSession(pomodoroSession);
    if (invalidateCache) invalidateCache();
    if (refreshStats) await refreshStats();
    triggerAchievementCheck();
  }, [addSession, invalidateCache, refreshStats, triggerAchievementCheck]);

  // Memoize expensive computations
  const allImminentTasks = useMemo(() => getAllImminentTasks(tasks), [tasks]);
  const displayedTasks = useMemo(() =>
    showAllUpcomingTasks ? allImminentTasks : allImminentTasks.slice(0, 5),
    [allImminentTasks, showAllUpcomingTasks]
  );
  const hasMoreTasksThanDisplayed = allImminentTasks.length > 5;

  useTheme();

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...GLOBAL_SHORTCUTS.START_PAUSE_TIMER,
      action: () => {
        if (timerRef) {
          if (timerRef.status === 'running') {
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
      key: 'f',
      description: 'Toggle Focus Mode',
      action: () => setFocusMode(!focusMode),
    },
  ]);

  return (
    <div className={`min-h-screen bg-background ${focusMode ? 'focus-mode' : ''}`}>
      {!focusMode && <Header />}

      <main className={`max-w-6xl mx-auto px-6 py-8 space-y-6 ${focusMode ? 'focus-mode-container' : ''}`}>
        {/* Tasks Section - Full Width */}
        {!focusMode && (
          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tasks</CardTitle>
                <Button onClick={handleCreateTask} size="sm" className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
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
                      onClick={() => setShowAllUpcomingTasks(!showAllUpcomingTasks)}
                      className="text-sm"
                    >
                      {showAllUpcomingTasks
                        ? 'Voir moins'
                        : `Voir ${allImminentTasks.length - 5} tâche${allImminentTasks.length - 5 > 1 ? 's' : ''} de plus`
                      }
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pomodoro Timer */}
        <Card variant="elevated" className={focusMode ? 'focus-mode-timer' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pomodoro Timer</CardTitle>
              <Link href="/settings">
                <button className="p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors" title="Timer Settings">
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </Link>
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
        {!focusMode && notifications.length > 0 && (
          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Notifications</CardTitle>
                <button
                  onClick={() => notifications.forEach(n => markAsRead(n.id))}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Mark all read
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border ${notification.read ? 'border-border bg-card' : 'border-primary/20 bg-primary/5'
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{notification.title}</p>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs text-primary hover:underline"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {notifications.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    And {notifications.length - 5} more...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
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
      <Button
        onClick={() => setFocusMode(!focusMode)}
        className="fixed top-6 right-6 z-50 gap-2"
        variant={focusMode ? 'primary' : 'outline'}
        title="Toggle Focus Mode (F)"
      >
        {focusMode ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Quitter Focus
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1v6m0 6v6M1 12h6m6 0h6" />
            </svg>
            Mode Focus
          </>
        )}
      </Button>

      {/* Keyboard shortcut hint */}
      {!focusMode && (
        <button
          onClick={() => setShowShortcuts(true)}
          className="fixed bottom-6 right-6 p-3 bg-card border-2 border-border rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
          title="Keyboard shortcuts (Shift + ?)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-foreground"
          >
            <rect x="2" y="4" width="20" height="16" rx="2"></rect>
            <path d="M6 8h.001"></path>
            <path d="M10 8h.001"></path>
            <path d="M14 8h.001"></path>
            <path d="M18 8h.001"></path>
            <path d="M8 12h.001"></path>
            <path d="M12 12h.001"></path>
            <path d="M16 12h.001"></path>
            <path d="M7 16h10"></path>
          </svg>
        </button>
      )}
    </div>
  );
}
