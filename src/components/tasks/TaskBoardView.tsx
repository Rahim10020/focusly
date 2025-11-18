'use client';

import { Task, Tag, TaskStatus } from '@/types';
import Button from '../ui/Button';

interface TaskBoardViewProps {
    tasks: Task[];
    activeTaskId: string | null;
    tags: Tag[];
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onSelectTask: (id: string | null) => void;
    onUpdate: (id: string, updates: Partial<Task>) => void;
    onStatusChange: (id: string, status: TaskStatus) => void;
    onEditTask: (task: Task) => void;
}

export default function TaskBoardView({
    tasks,
    activeTaskId,
    tags,
    onToggle,
    onDelete,
    onSelectTask,
    onUpdate,
    onStatusChange,
    onEditTask,
}: TaskBoardViewProps) {
    const columns: { id: TaskStatus; title: string; color: string }[] = [
        { id: 'todo', title: 'To Do', color: 'bg-muted-foreground/10 border-muted-foreground/20' },
        { id: 'in-progress', title: 'In Progress', color: 'bg-warning/10 border-warning/20' },
        { id: 'done', title: 'Done', color: 'bg-success/10 border-success/20' },
    ];

    const getTasksByStatus = (status: TaskStatus) => {
        return tasks.filter(task => {
            const taskStatus = task.status || (task.completed ? 'done' : 'todo');
            return taskStatus === status;
        });
    };

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData('taskId', taskId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if (taskId) {
            onStatusChange(taskId, targetStatus);
        }
    };

    const getTaskTags = (task: Task) => {
        return tags.filter(tag => task.tags?.includes(tag.id));
    };

    return (
        <div className="h-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                {columns.map((column) => {
                    const columnTasks = getTasksByStatus(column.id);

                    return (
                        <div
                            key={column.id}
                            className="flex flex-col min-h-[500px]"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, column.id)}
                        >
                            {/* Column Header */}
                            <div className={`flex items-center justify-between p-4 rounded-t-xl border-2 ${column.color}`}>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-foreground">{column.title}</h3>
                                    <span className="px-2 py-0.5 bg-background/50 rounded-full text-xs font-medium">
                                        {columnTasks.length}
                                    </span>
                                </div>
                            </div>

                            {/* Column Body */}
                            <div className="flex-1 bg-card border-2 border-t-0 border-border rounded-b-xl p-4 space-y-3 overflow-y-auto">
                                {columnTasks.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                                        <svg className="w-12 h-12 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                        </svg>
                                        <p className="text-sm">No tasks</p>
                                    </div>
                                ) : (
                                    columnTasks.map((task) => {
                                        const taskTags = getTaskTags(task);
                                        const isActive = activeTaskId === task.id;

                                        return (
                                            <div
                                                key={task.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, task.id)}
                                                className={`p-4 rounded-xl border-2 bg-card transition-all duration-300 cursor-grab active:cursor-grabbing hover:shadow-md group ${isActive
                                                    ? 'border-primary/40 shadow-md ring-2 ring-primary/20'
                                                    : 'border-border hover:border-primary/30'
                                                    }`}
                                            >
                                                {/* Task Header */}
                                                <div className="flex items-start gap-3 mb-3">
                                                    <button
                                                        onClick={() => {
                                                            if (task.status === 'done') {
                                                                onStatusChange(task.id, 'todo');
                                                            } else {
                                                                onStatusChange(task.id, 'done');
                                                            }
                                                        }}
                                                        className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${task.status === 'done'
                                                            ? 'bg-success border-success'
                                                            : 'border-primary hover:bg-primary/10'
                                                            }`}
                                                    >
                                                        {task.status === 'done' && (
                                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </button>

                                                    <div className="flex-1 min-w-0">
                                                        <div>
                                                            <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                                                {task.title}
                                                            </p>
                                                            {task.dueDate && (
                                                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                    </svg>
                                                                    <span>{new Date(task.dueDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                                                                    {new Date(task.dueDate).toDateString() === new Date().toDateString() && (
                                                                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
                                                                            Today
                                                                        </span>
                                                                    )}
                                                                    {task.dueDate < Date.now() && task.status !== 'done' && (
                                                                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-error/10 text-error text-[10px] font-medium">
                                                                            Overdue
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Task Meta */}
                                                <div className="space-y-2">
                                                    {/* Priority & Tags */}
                                                    <div className="flex flex-wrap gap-2">
                                                        {task.priority && (
                                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${task.priority === 'high' ? 'bg-error/10 text-error' :
                                                                task.priority === 'medium' ? 'bg-warning/10 text-warning' :
                                                                    'bg-info/10 text-info'
                                                                }`}>
                                                                {task.priority}
                                                            </span>
                                                        )}
                                                        {taskTags.slice(0, 2).map(tag => (
                                                            <span
                                                                key={tag.id}
                                                                className="px-2 py-0.5 rounded text-xs"
                                                                style={{ backgroundColor: tag.color + '20', color: tag.color }}
                                                            >
                                                                {tag.name}
                                                            </span>
                                                        ))}
                                                        {taskTags.length > 2 && (
                                                            <span className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                                                                +{taskTags.length - 2}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Pomodoros */}
                                                    {task.pomodoroCount > 0 && (
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <span>🍅</span>
                                                            <span>{task.pomodoroCount}</span>
                                                        </div>
                                                    )}

                                                    {/* Active Badge */}
                                                    {isActive && (
                                                        <div className="flex items-center gap-1 text-xs text-primary font-medium">
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                <circle cx="10" cy="10" r="5" />
                                                            </svg>
                                                            <span>Active</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions (show on hover) */}
                                                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => onEditTask(task)}
                                                        className="text-xs"
                                                    >
                                                        Edit
                                                    </Button>
                                                    {!isActive && task.status !== 'done' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => onSelectTask(task.id)}
                                                            className="text-xs"
                                                        >
                                                            Set Active
                                                        </Button>
                                                    )}
                                                    {isActive && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => onSelectTask(null)}
                                                            className="text-xs"
                                                        >
                                                            Unset
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => onDelete(task.id)}
                                                        className="text-xs text-error hover:bg-error/10"
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
