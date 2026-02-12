'use client';

import type { Task } from '@/types';

interface TaskSelectorProps {
    tasks: Task[];
    activeTaskId: string | null;
    onSelectTask: (taskId: string | null) => void;
}

export default function TaskSelector({
    tasks,
    activeTaskId,
    onSelectTask,
}: TaskSelectorProps) {
    const activeTasks = tasks.filter((task) => !task.completed);

    return (
        <div className="space-y-2">
            <label htmlFor="pomodoro-task-selector" className="text-sm font-medium text-foreground">
                Task to focus on
            </label>
            <select
                id="pomodoro-task-selector"
                value={activeTaskId ?? ''}
                onChange={(event) => onSelectTask(event.target.value || null)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
            >
                <option value="">No task selected</option>
                {activeTasks.map((task) => (
                    <option key={task.id} value={task.id}>
                        {task.title}
                    </option>
                ))}
            </select>
        </div>
    );
}
