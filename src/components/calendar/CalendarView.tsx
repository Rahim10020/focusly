'use client';

import { useState, useMemo } from 'react';
import { Task } from '@/types';
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    format,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isToday,
} from 'date-fns';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface CalendarViewProps {
    tasks: Task[];
    onTaskClick?: (task: Task) => void;
}

export default function CalendarView({ tasks, onTaskClick }: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const tasksByDate = useMemo(() => {
        const map = new Map<string, Task[]>();

        tasks.forEach(task => {
            if (task.startDate) {
                const dateKey = format(new Date(task.startDate), 'yyyy-MM-dd');
                if (!map.has(dateKey)) {
                    map.set(dateKey, []);
                }
                map.get(dateKey)!.push(task);
            }
            if (task.dueDate) {
                const dateKey = format(new Date(task.dueDate), 'yyyy-MM-dd');
                if (!map.has(dateKey)) {
                    map.set(dateKey, []);
                }
                // Only add if not already added from startDate
                const existing = map.get(dateKey)!;
                if (!existing.some(t => t.id === task.id)) {
                    existing.push(task);
                }
            }
        });

        return map;
    }, [tasks]);

    const getTasksForDate = (date: Date) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        return tasksByDate.get(dateKey) || [];
    };

    const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

    const getPriorityColor = (priority?: 'low' | 'medium' | 'high') => {
        switch (priority) {
            case 'high':
                return 'bg-red-500';
            case 'medium':
                return 'bg-yellow-500';
            case 'low':
                return 'bg-green-500';
            default:
                return 'bg-blue-500';
        }
    };

    return (
        <div className="space-y-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{format(currentDate, 'MMMM yyyy')}</h2>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setCurrentDate(new Date())}
                    >
                        Today
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar Grid */}
                <div className="lg:col-span-2">
                    <Card className="p-4">
                        {/* Day Headers */}
                        <div className="grid grid-cols-7 gap-2 mb-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Days */}
                        <div className="grid grid-cols-7 gap-2">
                            {days.map((day, index) => {
                                const dayTasks = getTasksForDate(day);
                                const isCurrentMonth = isSameMonth(day, currentDate);
                                const isSelected = selectedDate && isSameDay(day, selectedDate);
                                const isDayToday = isToday(day);

                                return (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedDate(day)}
                                        className={`
                                            min-h-[100px] p-2 rounded-lg border transition-all
                                            ${isCurrentMonth ? 'bg-card' : 'bg-muted/30'}
                                            ${isSelected ? 'border-primary border-2 bg-primary/10' : 'border-border'}
                                            ${isDayToday ? 'ring-2 ring-primary/50' : ''}
                                            hover:bg-accent
                                        `}
                                    >
                                        <div className="text-left">
                                            <div className={`text-sm font-semibold mb-1 ${isDayToday ? 'text-primary' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                                                }`}>
                                                {format(day, 'd')}
                                            </div>
                                            <div className="space-y-1">
                                                {dayTasks.slice(0, 3).map(task => (
                                                    <div
                                                        key={task.id}
                                                        className={`text-xs px-1.5 py-0.5 rounded ${getPriorityColor(task.priority)} text-white truncate`}
                                                        title={task.title}
                                                    >
                                                        {task.title}
                                                    </div>
                                                ))}
                                                {dayTasks.length > 3 && (
                                                    <div className="text-xs text-muted-foreground">
                                                        +{dayTasks.length - 3} more
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </Card>
                </div>

                {/* Selected Date Tasks */}
                <div className="lg:col-span-1">
                    <Card className="p-4">
                        <h3 className="text-lg font-semibold mb-4">
                            {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Select a date'}
                        </h3>

                        {selectedDate && (
                            <>
                                {selectedDateTasks.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        No tasks scheduled for this day
                                    </p>
                                ) : (
                                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                        {selectedDateTasks.map(task => (
                                            <button
                                                key={task.id}
                                                onClick={() => onTaskClick?.(task)}
                                                className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                                            >
                                                <div className="flex items-start gap-2">
                                                    <div className={`w-3 h-3 rounded-full mt-1 ${getPriorityColor(task.priority)}`}></div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium truncate">{task.title}</div>
                                                        {task.startTime && (
                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                {task.startTime}
                                                                {task.endTime && ` - ${task.endTime}`}
                                                            </div>
                                                        )}
                                                        {task.estimatedDuration && (
                                                            <div className="text-xs text-muted-foreground">
                                                                {task.estimatedDuration} min
                                                            </div>
                                                        )}
                                                        {task.notes && (
                                                            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                                {task.notes}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {task.completed && (
                                                        <div className="flex-shrink-0">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                                                                <polyline points="20 6 9 17 4 12"></polyline>
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </Card>

                    {/* Legend */}
                    <Card className="p-4 mt-4">
                        <h3 className="text-sm font-semibold mb-3">Priority Legend</h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <span>High Priority</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <span>Medium Priority</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span>Low Priority</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <span>No Priority</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
