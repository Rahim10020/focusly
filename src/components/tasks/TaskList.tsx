'use client';

import { Task } from '@/types';
import TaskItem from './TaskItem';

interface TaskListProps {
    tasks: Task[];
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
}

export default function TaskList({ tasks, onToggle, onDelete }: TaskListProps) {
    const activeTasks = tasks.filter(task => !task.completed);
    const completedTasks = tasks.filter(task => task.completed);

    if (tasks.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>No tasks yet. Add one to get started!</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {activeTasks.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Active Tasks ({activeTasks.length})
                    </h3>
                    <div className="space-y-2">
                        {activeTasks.map(task => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                onToggle={onToggle}
                                onDelete={onDelete}
                            />
                        ))}
                    </div>
                </div>
            )}

            {completedTasks.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Completed ({completedTasks.length})
                    </h3>
                    <div className="space-y-2">
                        {completedTasks.map(task => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                onToggle={onToggle}
                                onDelete={onDelete}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}