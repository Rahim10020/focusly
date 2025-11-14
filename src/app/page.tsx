'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import TaskList from '@/components/tasks/TaskList';
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
        <main className="max-w-4xl mx-auto px-6 py-25 text-center">
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-4">Welcome to Focusly</h1>
              <p className="text-xl text-muted-foreground mb-8">
                Boost your productivity with our Pomodoro timer and task management system.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card>
                <CardContent className="p-6">
                  <div className="text-3xl mb-4">⏰</div>
                  <h3 className="font-semibold mb-2">Pomodoro Timer</h3>
                  <p className="text-sm text-muted-foreground">
                    Stay focused with timed work sessions and breaks.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-3xl mb-4">📋</div>
                  <h3 className="font-semibold mb-2">Task Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Organize and track your tasks efficiently.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-3xl mb-4">🏆</div>
                  <h3 className="font-semibold mb-2">Achievements</h3>
                  <p className="text-sm text-muted-foreground">
                    Unlock achievements as you build productive habits.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <p className="text-lg">Create an account to save your progress and sync across devices.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => router.push('/auth/signup')} size="lg">
                  Create Account
                </Button>
                <Button onClick={() => router.push('/auth/signin')} variant="secondary" size="lg">
                  Sign In
                </Button>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Your Tasks</h3>
                  <Button onClick={() => router.push('/create-task')} className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Create New Task
                  </Button>
                </div>
                <TaskList
                  tasks={tasks}
                  activeTaskId={activeTaskId}
                  tags={tags}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                  onSelectTask={setActiveTask}
                  onUpdate={updateTask}
                  onAddSubTask={addSubTask}
                  onToggleSubTask={toggleSubTask}
                  onDeleteSubTask={deleteSubTask}
                  onReorder={reorderTasks}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
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
        </div>
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
        className="fixed bottom-6 right-6 p-3 bg-card border-2 border-border rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
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