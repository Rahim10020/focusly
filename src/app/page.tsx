'use client';

import { useEffect } from 'react';
import Header from '@/components/layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import TaskForm from '@/components/tasks/TaskForm';
import TaskList from '@/components/tasks/TaskList';
import PomodoroTimer from '@/components/pomodoro/PomodoroTimer';
import StatsOverview from '@/components/stats/StatsOverview';
import AchievementNotification from '@/components/achievements/AchievementNotification';
import { useTasks } from '@/lib/hooks/useTasks';
import { useStats } from '@/lib/hooks/useStats';
import { useAchievements } from '@/lib/hooks/useAchievements';
import { useTags } from '@/lib/hooks/useTags';

export default function Home() {
  const {
    tasks,
    activeTaskId,
    addTask,
    toggleTask,
    deleteTask,
    setActiveTask,
    incrementPomodoro,
  } = useTasks();

  const { updateTaskStats, addSession, getTodayFocusTime, stats } = useStats();
  const { tags } = useTags();
  const {
    newlyUnlocked,
    clearNewlyUnlocked,
    checkAchievements,
    checkTimeBasedAchievements
  } = useAchievements();

  useEffect(() => {
    const completedTasks = tasks.filter(task => task.completed).length;
    updateTaskStats(tasks.length, completedTasks);

    // Check achievements
    const todayFocusMinutes = Math.floor(getTodayFocusTime() / 60);
    checkAchievements({
      totalSessions: stats.totalSessions,
      completedTasks: stats.completedTasks,
      streak: stats.streak,
      todayFocusMinutes,
    });
  }, [tasks, stats, updateTaskStats, getTodayFocusTime, checkAchievements]);

  const handlePomodoroComplete = (taskId: string) => {
    incrementPomodoro(taskId);

    // Check time-based achievements
    const hour = new Date().getHours();
    checkTimeBasedAchievements(hour);
  };

  const handleSessionComplete = (session: any) => {
    addSession(session);

    // Re-check achievements after session
    const todayFocusMinutes = Math.floor(getTodayFocusTime() / 60);
    checkAchievements({
      totalSessions: stats.totalSessions + 1,
      completedTasks: stats.completedTasks,
      streak: stats.streak,
      todayFocusMinutes,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <StatsOverview />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <TaskForm
                  onAddTask={addTask}
                  availableTags={tags}
                />
                <TaskList
                  tasks={tasks}
                  activeTaskId={activeTaskId}
                  tags={tags}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                  onSelectTask={setActiveTask}
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
    </div>
  );
}