'use client';

import { Task } from '@/types';

interface TaskSelectorProps {
    tasks: Task[];
    activeTaskId: string | null;
    onSelectTask: (taskId: string | null) => void;
    disabled?: boolean;
}

export default function TaskSelector({
    tasks,
    activeTaskId,
    onSelectTask,
    disabled = false,
}: TaskSelectorProps) {
    const activeTasks = tasks.filter(task => !task.completed);

    if (activeTasks.length === 0) {
        return (
            <div className="text-center py-4 text-muted-foreground text-sm">
                No active tasks. Add a task to link it to your pomodoro!
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Link to Task (Optional)
            </label>

            <div className="space-y-2">
                <button
                    onClick={() => onSelectTask(null)}
                    disabled={disabled}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${activeTaskId === null
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-muted hover:bg-accent'
                        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                    <span className="text-sm text-foreground">No task selected</span>
                </button>

                {activeTasks.map((task) => (
                    <button
                        key={task.id}
                        onClick={() => onSelectTask(task.id)}
                        disabled={disabled}
                        className={`w-full text-left p-3 rounded-xl border-2 transition-all ${activeTaskId === task.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-muted hover:bg-accent'
                            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground font-medium">
                                {task.title}
                            </span>
                            {task.pomodoroCount > 0 && (
                                <span className="text-xs text-muted-foreground">
                                    🍅 {task.pomodoroCount}
                                </span>
                            )}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}