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
  const { tasks, addTask, toggleTask, deleteTask } = useTasks();
  const { updateTaskStats } = useStats();

  useEffect(() => {
    const completedTasks = tasks.filter(task => task.completed).length;
    updateTaskStats(tasks.length, completedTasks);
  }, [tasks]);

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
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pomodoro Timer</CardTitle>
            </CardHeader>
            <CardContent>
              <PomodoroTimer />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}