/**
 * @fileoverview TaskSelector component for selecting an active task to link with the timer.
 * Displays a list of incomplete tasks that can be associated with pomodoro sessions.
 */

'use client';

import { Task } from '@/types';

/**
 * Props for the TaskSelector component.
 */
interface TaskSelectorProps {
    tasks: Task[];
    activeTaskId: string | null;
    onSelectTask: (taskId: string | null) => void;
    /** Whether selection is disabled */
    disabled?: boolean;
}

/**
 * TaskSelector component allows users to select or deselect a task to link with the timer.
 * Displays all incomplete tasks with their titles and pomodoro counts.
 * Used to associate pomodoro sessions with specific tasks for tracking.
 *
 * @param {TaskSelectorProps} props - Component props
 * @param {Task[]} props.tasks - Array of all tasks (will filter to incomplete only)
 * @param {string | null} props.activeTaskId - ID of the currently selected task
 * @param {function} props.onSelectTask - Callback when task selection changes
 * @param {boolean} [props.disabled=false] - Whether selection is disabled
 *
 * @example
 * <TaskSelector
 *   tasks={allTasks}
 *   activeTaskId={selectedTaskId}
 *   onSelectTask={(taskId) => setSelectedTaskId(taskId)}
 *   disabled={isTimerRunning}
 * />
 */
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