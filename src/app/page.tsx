'use client';

import { useEffect } from 'react';
import Header from '@/components/layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import TaskForm from '@/components/tasks/TaskForm';
import TaskList from '@/components/tasks/TaskList';
import PomodoroTimer from '@/components/pomodoro/PomodoroTimer';
import StatsOverview from '@/components/stats/StatsOverview';
import { useTasks } from '@/lib/hooks/useTasks';
import { useStats } from '@/lib/hooks/useStats';

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

  const { updateTaskStats, addSession } = useStats();

  useEffect(() => {
    const completedTasks = tasks.filter(task => task.completed).length;
    updateTaskStats(tasks.length, completedTasks);
  }, [tasks, updateTaskStats]);

  const handlePomodoroComplete = (taskId: string) => {
    incrementPomodoro(taskId);
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
                <TaskForm onAddTask={addTask} />
                <TaskList
                  tasks={tasks}
                  activeTaskId={activeTaskId}
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
                onSessionComplete={addSession}
                onPomodoroComplete={handlePomodoroComplete}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}