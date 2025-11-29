/**
 * @fileoverview Home page component for the Focusly application.
 * This is the main entry point that displays the landing page for unauthenticated users
 * and the dashboard with tasks, Pomodoro timer, and stats overview for authenticated users.
 * @module app/page
 */

'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import TasksView from '@/components/tasks/TasksView';
import QuickAddTask from '@/components/tasks/QuickAddTask';
import PomodoroTimer from '@/components/pomodoro/PomodoroTimer';

// Lazy load heavy components with loading states
const StatsOverview = dynamic(() => import('@/components/stats/StatsOverview'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-muted/30 h-32 rounded-lg" />
});

import AchievementNotification from '@/components/achievements/AchievementNotification';
import KeyboardShortcutsModal from '@/components/ui/KeyboardShortcutsModal';
import Button from '@/components/ui/Button';
import { useTasks } from '@/lib/hooks/useTasks';
import { useCachedStats } from '@/lib/hooks/useCachedStats';
import { useAchievements } from '@/lib/hooks/useAchievements';
import { useTags } from '@/lib/hooks/useTags';
import { useKeyboardShortcuts, GLOBAL_SHORTCUTS } from '@/lib/hooks/useKeyboardShortcuts';
import { useTaskNotifications } from '@/lib/hooks/useTaskNotifications';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { Task } from '@/types';
import { useTheme } from '@/components/providers/ThemeProvider';

/**
 * Combines a date timestamp with a time string to create a full datetime timestamp.
 * @param {number} timestamp - The base date timestamp in milliseconds
 * @param {string} [startTime] - Optional time string in "HH:MM" format
 * @returns {number} The combined timestamp, or original timestamp if no valid time provided
 */
const combineDateAndTime = (timestamp: number, startTime?: string) => {
  if (!startTime) return timestamp;
  const [hoursStr, minutesStr] = startTime.split(':');
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return timestamp;
  }
  const date = new Date(timestamp);
  date.setHours(hours, minutes, 0, 0);
  return date.getTime();
};

/**
 * Retrieves the scheduling timestamp for a task, prioritizing start date over due date.
 * @param {Task} task - The task to get the schedule timestamp for
 * @returns {number | null} The timestamp for scheduling, or null if no dates are set
 */
const getTaskScheduleTimestamp = (task: Task) => {
  if (task.startDate) {
    return combineDateAndTime(task.startDate, task.startTime);
  }
  if (task.dueDate) {
    return task.dueDate;
  }
  return null;
};

/**
 * Retrieves the most imminent active tasks, sorted by schedule date then creation date.
 * @param {Task[]} tasks - Array of all tasks
 * @param {number} [limit=5] - Maximum number of tasks to return
 * @returns {Task[]} Array of the most imminent active tasks
 */
const getImminentTasks = (tasks: Task[], limit = 5) => {
  const activeTasks = tasks.filter(task => !task.completed);

  const scheduledTasks = activeTasks
    .map(task => ({ task, scheduledAt: getTaskScheduleTimestamp(task) }))
    .filter(item => item.scheduledAt !== null)
    .sort((a, b) => (a.scheduledAt! - b.scheduledAt!))
    .map(item => item.task);

  const fallbackTasks = activeTasks
    .filter(task => getTaskScheduleTimestamp(task) === null)
    .sort((a, b) => a.createdAt - b.createdAt);

  return [...scheduledTasks, ...fallbackTasks].slice(0, limit);
};

/**
 * Home page component that serves as the main entry point for the Focusly application.
 * Displays a marketing landing page for unauthenticated users, or a productivity dashboard
 * with task management, Pomodoro timer, and statistics for authenticated users.
 *
 * @returns {JSX.Element} The rendered home page component
 */
export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const taskInputRef = useRef<HTMLInputElement>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [mounted, setMounted] = useState(false);
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

  // Enable task notifications (user can be notified about upcoming tasks)
  const { requestPermission } = useTaskNotifications({
    tasks,
    enabled: typeof window !== 'undefined' && session !== null,
  });

  const { notifications, markAsRead } = useNotifications();

  // Utiliser useRef pour les valeurs qui changent fréquemment (optimisation Pomodoro)
  const statsRef = useRef(stats);
  const tasksRef = useRef(tasks);

  useEffect(() => {
    statsRef.current = stats;
    tasksRef.current = tasks;
  }, [stats, tasks]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mise à jour des stats de tâches
  useEffect(() => {
    const completedTasks = tasks.filter(task => task.completed).length;
    updateTaskStats(tasks.length, completedTasks);
  }, [tasks, updateTaskStats]);

  // Vérification des achievements avec useRef pour éviter les appels répétés
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
      setAchievementCheckPending(true);
      prevStatsRef.current = currentStats;
    }
  }, [currentStats]);

  // Debouncing/batching de checkAchievements pour éviter les appels répétés
  useEffect(() => {
    if (achievementCheckPending) {
      const timer = setTimeout(async () => {
        await checkAchievements(currentStats);
        setAchievementCheckPending(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [achievementCheckPending, checkAchievements, currentStats]);

  // Marquer comme pending au lieu d'appeler directement checkAchievements
  const triggerAchievementCheck = useCallback(() => {
    setAchievementCheckPending(true);
  }, []);

  // Task handlers - redirect to dedicated task page - Memoized to avoid re-renders
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

  const handleSessionComplete = useCallback(async (session: any) => {
    // Ajouter la session
    await addSession(session);

    // Invalider le cache pour forcer le rechargement des stats
    if (invalidateCache) {
      invalidateCache();
    }

    // Rafraîchir les stats immédiatement après
    if (refreshStats) {
      await refreshStats();
    }

    // Déclencher la vérification des achievements (debounced)
    triggerAchievementCheck();
  }, [addSession, invalidateCache, refreshStats, triggerAchievementCheck]);

  // Memoize expensive computations
  const imminentTasks = useMemo(() => getImminentTasks(tasks, 100), [tasks]); // Get all tasks
  const displayedTasks = useMemo(() =>
    showAllUpcomingTasks ? imminentTasks : imminentTasks.slice(0, 5),
    [imminentTasks, showAllUpcomingTasks]
  );
  const totalActiveTasks = useMemo(() => tasks.filter(task => !task.completed).length, [tasks]);
  const hasMoreTasksThanDisplayed = imminentTasks.length > 5;

  // Get recently completed tasks (last 5) - Memoized
  // ✅ Vérifier que completedAt existe
  const completedTasks = useMemo(() =>
    tasks
      .filter(task => task.completed && task.completedAt)
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
      .slice(0, 5),
    [tasks]
  );

  // Use theme from context
  const { toggleTheme } = useTheme();

  // Page-specific keyboard shortcuts (timer controls and new task)
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
        if (timerRef) {
          timerRef.reset();
        }
      },
    },
    {
      ...GLOBAL_SHORTCUTS.SKIP_SESSION,
      action: () => {
        if (timerRef) {
          timerRef.skip();
        }
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

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background transition-colors duration-200">
        {/* Hero Section */}
        <main className="relative overflow-hidden min-h-screen flex items-center">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-brand-accent/5 dark:from-primary/10 dark:to-brand-accent/10 pointer-events-none"></div>

          {/* Floating Feature Cards - Background */}
          <div className="absolute inset-0 max-w-[1200px] mx-auto px-6 pointer-events-none hidden lg:block">
            <div className="relative h-full">
              {/* Left Card - Pomodoro Timer */}
              <div className="absolute -left-10 top-10 w-80 opacity-70 blur-[0.1px] animate-float">
                <Card variant="elevated" className="group bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-2xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg text-foreground font-semibold mb-2">Pomodoro Timer</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Stay focused with customizable 25-minute work sessions followed by refreshing breaks.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Right Top Card - Smart Task Management */}
              <div className="absolute -right-12 top-12 w-80 opacity-70 blur-[0.1px] animate-float-delayed">
                <Card variant="elevated" className="group bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-brand-secondary/10 rounded-2xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-brand-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <h3 className="text-lg text-foreground font-semibold mb-2">Smart Task Management</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Organize tasks by priority, add sub-tasks, and track your progress with detailed insights.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Right Bottom Card - Achievements */}
              <div className="absolute -right-6 bottom-12 w-80 opacity-70 blur-[0.1px] animate-float-slow">
                <Card variant="elevated" className="group bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-brand-accent/10 rounded-2xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <h3 className="text-lg text-foreground font-semibold mb-2">Achievements & Stats</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Build streaks, unlock achievements, and compete with friends on the leaderboard.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Left Bottom Card - Calendar */}
              <div className="absolute -left-12 bottom-10 w-80 opacity-70 blur-[0.1px] animate-float-delayed">
                <Card variant="elevated" className="group bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-brand-secondary/10 rounded-2xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-brand-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    <h3 className="text-lg text-foreground font-semibold mb-2">Calendar Planning</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Plot tasks on a monthly calendar, see start times, and export your schedule to iCal.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Center Card - Analytics */}
              <div className="absolute left-1/2 -translate-x-1/2 -top-6 w-80 opacity-70 blur-[0.1px] animate-float">
                <Card variant="elevated" className="group bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-2xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18M7 14l3 3 7-10" />
                      </svg>
                    </div>
                    <h3 className="text-lg text-foreground font-semibold mb-2">Analytics & Export</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Unlock charts, streak insights, and one-click CSV/PDF exports from the dashboard.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Right Middle Card - Social */}
              <div className="absolute -right-44 top-1/2 -translate-y-1/2 w-80 opacity-70 blur-[0.1px] animate-float">
                <Card variant="elevated" className="group bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-brand-accent/10 rounded-2xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 12a4 4 0 10-4-4 4 4 0 004 4zm0 0c-3.314 0-6 2.239-6 5v1h6m5-9a4 4 0 114-4 4 4 0 01-4 4zm0 0c-1.48 0-2.805.804-3.5 2" />
                      </svg>
                    </div>
                    <h3 className="text-lg text-foreground font-semibold mb-2">Friends & Leaderboard</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Add friends, accept requests, and climb global rankings for tasks, focus time, or streaks.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Left Mid Card - Notifications */}
              <div className="absolute -left-44 top-1/2 -translate-y-1/2 w-80 opacity-70 blur-[0.1px] animate-float-slow">
                <Card variant="elevated" className="group bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-brand-secondary/10 rounded-2xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-brand-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11c0-3.07-1.64-5.64-4.5-6.32V4a1.5 1.5 0 00-3 0v.68C7.64 5.36 6 7.92 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1" />
                      </svg>
                    </div>
                    <h3 className="text-lg text-foreground font-semibold mb-2">Smart Notifications</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Get alerted for overdue tasks, due-today reminders, and completed Pomodoros in real-time.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-6 py-16 md:py-24 relative z-10">
            {/* Hero Content */}
            <div className="text-center space-y-6">
              <div className="inline-block">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium animate-fade-in">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  The productive way to focus
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight animate-slide-up">
                Master Your Focus,
                <br />
                <span className="bg-gradient-to-r from-primary via-brand-secondary to-brand-accent bg-clip-text text-transparent">
                  Achieve Your Goals
                </span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
                Focusly combines the power of the Pomodoro Technique with smart task management
                to help you stay productive and build lasting habits.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <Button onClick={() => router.push('/auth/signup')} size="lg" className="min-w-[180px]">
                  <svg className="w-5 h-5 animate-arrow-slide" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  Get Started Free
                </Button>
                <Button onClick={() => router.push('/auth/signin')} variant="outline" size="lg" className="min-w-[180px]">
                  Sign In
                </Button>
              </div>

              {/* Social Proof */}
              <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground pt-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-brand-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  <span className="font-medium">Join productive teams</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-brand-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Free forever</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background ${focusMode ? 'focus-mode' : ''}`}>
      {!focusMode && <Header />}

      <main className={`max-w-6xl mx-auto px-6 py-8 space-y-6 ${focusMode ? 'focus-mode-container' : ''}`}>
        {!focusMode && mounted && <StatsOverview />}

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
                        : `Voir ${imminentTasks.length - 5} tâche${imminentTasks.length - 5 > 1 ? 's' : ''} de plus`
                      }
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recently Completed Tasks */}
        {!focusMode && completedTasks.length > 0 && (
          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recently Completed</CardTitle>
                <span className="text-sm text-muted-foreground">
                  {stats.completedTasks} total
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30"
                  >
                    <div className="flex-shrink-0 text-green-500">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-through text-muted-foreground truncate">
                        {task.title}
                      </p>
                      {task.completedAt && (
                        <p className="text-xs text-muted-foreground">
                          Completed {new Date(task.completedAt).toLocaleDateString()} at{' '}
                          {new Date(task.completedAt).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                    {task.pomodoroCount > 0 && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <span>🍅</span>
                        <span>{task.pomodoroCount}</span>
                      </div>
                    )}
                  </div>
                ))}
                {stats.completedTasks > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    And {stats.completedTasks - 5} more completed tasks...
                  </p>
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