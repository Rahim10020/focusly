'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import TasksView from '@/components/tasks/TasksView';
import QuickAddTask from '@/components/tasks/QuickAddTask';
import PomodoroTimer from '@/components/pomodoro/PomodoroTimer';
const StatsOverview = dynamic(() => import('@/components/stats/StatsOverview'), { ssr: false });
import AchievementNotification from '@/components/achievements/AchievementNotification';
import KeyboardShortcutsModal from '@/components/ui/KeyboardShortcutsModal';
import Button from '@/components/ui/Button';
import { useTasks } from '@/lib/hooks/useTasks';
import { useStats } from '@/lib/hooks/useStats';
import { useAchievements } from '@/lib/hooks/useAchievements';
import { useTags } from '@/lib/hooks/useTags';
import { useKeyboardShortcuts, GLOBAL_SHORTCUTS } from '@/lib/hooks/useKeyboardShortcuts';
import { useTaskNotifications } from '@/lib/hooks/useTaskNotifications';
import { Task } from '@/types';

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const taskInputRef = useRef<HTMLInputElement>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [mounted, setMounted] = useState(false);
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

  const { updateTaskStats, addSession, getTodayFocusTime, stats } = useStats();
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

  useEffect(() => {
    const todayFocusMinutes = Math.floor(getTodayFocusTime() / 60);
    const currentStats = {
      totalSessions: stats.totalSessions,
      completedTasks: stats.completedTasks,
      streak: stats.streak,
      todayFocusMinutes,
    };

    // Ne vérifie que si les stats ont réellement changé
    const hasChanged =
      prevStatsRef.current.totalSessions !== currentStats.totalSessions ||
      prevStatsRef.current.completedTasks !== currentStats.completedTasks ||
      prevStatsRef.current.streak !== currentStats.streak ||
      prevStatsRef.current.todayFocusMinutes !== currentStats.todayFocusMinutes;

    if (hasChanged) {
      checkAchievements(currentStats);
      prevStatsRef.current = currentStats;
    }
  }, [stats.totalSessions, stats.completedTasks, stats.streak, getTodayFocusTime, checkAchievements]);

  // Task handlers - redirect to dedicated task page
  const handleQuickAddTask = (title: string) => {
    addTask({ title });
  };

  const handleCreateTask = () => {
    router.push('/create-task');
  };

  const handleEditTask = (task: Task) => {
    router.push(`/task/${task.id}`);
  };

  const handlePomodoroComplete = (taskId: string) => {
    incrementPomodoro(taskId);
    const hour = new Date().getHours();
    checkTimeBasedAchievements(hour);
  };

  const handleSessionComplete = (session: any) => {
    addSession(session);
  };

  // Toggle theme function
  const toggleTheme = () => {
    const html = document.documentElement;
    const isDark = html.classList.contains('dark');
    if (isDark) {
      html.classList.remove('dark');
      localStorage.setItem('focusly_theme', 'light');
    } else {
      html.classList.add('dark');
      localStorage.setItem('focusly_theme', 'dark');
    }
  };

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
      ...GLOBAL_SHORTCUTS.TOGGLE_THEME,
      action: toggleTheme,
    },
    {
      ...GLOBAL_SHORTCUTS.SHOW_SHORTCUTS,
      action: () => setShowShortcuts(true),
    },
    {
      ...GLOBAL_SHORTCUTS.GO_TO_HOME,
      action: () => router.push('/'),
    },
    {
      ...GLOBAL_SHORTCUTS.GO_TO_STATS,
      action: () => router.push('/stats'),
    },
    {
      ...GLOBAL_SHORTCUTS.GO_TO_SETTINGS,
      action: () => router.push('/settings'),
    },
    {
      ...GLOBAL_SHORTCUTS.GO_TO_LEADERBOARD,
      action: () => router.push('/leaderboard'),
    },
    {
      ...GLOBAL_SHORTCUTS.GO_TO_FRIENDS,
      action: () => router.push('/friends'),
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
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <main className="relative overflow-hidden min-h-screen flex items-center">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-brand-accent/5 pointer-events-none"></div>

          {/* Floating Feature Cards - Background */}
          <div className="absolute inset-0 max-w-7xl mx-auto px-6 pointer-events-none">
            <div className="relative h-full">
              {/* Left Card - Pomodoro Timer */}
              <div className="absolute left-0 top-1/7 w-90 opacity-70 blur-[0.1px] scale-90 animate-float">
                <Card variant="elevated" className="group">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-2xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Pomodoro Timer</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Stay focused with customizable 25-minute work sessions followed by refreshing breaks.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Right Top Card - Smart Task Management */}
              <div className="absolute right-10 top-1/7 w-90 opacity-70 blur-[0.1px] scale-90 animate-float-delayed">
                <Card variant="elevated" className="group">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-brand-secondary/10 rounded-2xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-brand-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Smart Task Management</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Organize tasks by priority, add sub-tasks, and track your progress with detailed insights.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Right Bottom Card - Achievements */}
              <div className="absolute right-0 bottom-1/4 w-90 opacity-70 blur-[0.1px] scale-90 animate-float-slow">
                <Card variant="elevated" className="group">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-brand-accent/10 rounded-2xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Achievements & Stats</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Build streaks, unlock achievements, and compete with friends on the leaderboard.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
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
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {mounted && <StatsOverview />}

        {/* Tasks Section - Full Width */}
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
                tasks={tasks}
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
              />
            </div>
          </CardContent>
        </Card>

        {/* Pomodoro Timer */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Pomodoro Timer</CardTitle>
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

      {/* Keyboard shortcut hint */}
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
    </div>
  );
}