'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '@/components/layout/Header';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SubTaskManager from '@/components/tasks/SubTaskManager';
import { Domain, SubDomain, DOMAINS, Priority, Task, SubTask } from '@/types';
import { useTasks } from '@/lib/hooks/useTasks';
import { useTags } from '@/lib/hooks/useTags';
import {
    validateTimeRange,
    validateDateRange,
    checkTimeOverlaps,
    calculateDuration,
    calculateEndTime,
    formatDuration,
    estimatePomodoros
} from '@/lib/utils/timeValidation';

export default function TaskPage() {
    const router = useRouter();
    const params = useParams();
    const taskId = params.id as string;
    const isEditMode = taskId && taskId !== 'new';

    const { data: session, status } = useSession();
    const { tasks, addTask, updateTask, addSubTask, toggleSubTask, deleteSubTask } = useTasks();
    const { tags } = useTags();

    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState<Priority | undefined>(undefined);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [dueDate, setDueDate] = useState('');
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [estimatedDuration, setEstimatedDuration] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedSubDomain, setSelectedSubDomain] = useState<SubDomain | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');
    const [subTasks, setSubTasks] = useState<SubTask[]>([]);

    // Validation states
    const [errors, setErrors] = useState<string[]>([]);
    const [warnings, setWarnings] = useState<string[]>([]);
    const [hasTimeOverlap, setHasTimeOverlap] = useState(false);
    const [overlappingTasks, setOverlappingTasks] = useState<Task[]>([]);

    // Load task data in edit mode
    useEffect(() => {
        if (isEditMode) {
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                setTitle(task.title);
                setPriority(task.priority);
                setSelectedTags(task.tags || []);
                setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
                setStartDate(task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '');
                setStartTime(task.startTime || '');
                setEndTime(task.endTime || '');
                setEstimatedDuration(task.estimatedDuration?.toString() || '');
                setNotes(task.notes || '');
                setSelectedSubDomain(task.subDomain);
                setSubTasks(task.subTasks || []);
            }
        }
    }, [isEditMode, taskId, tasks]);

    // Validate time range and check overlaps
    useEffect(() => {
        const newErrors: string[] = [];
        const newWarnings: string[] = [];

        // Validate time range
        if (startTime && endTime) {
            const timeValidation = validateTimeRange(startTime, endTime);
            newErrors.push(...timeValidation.errors);
            newWarnings.push(...timeValidation.warnings);

            // Auto-calculate duration if not set
            if (timeValidation.valid && !estimatedDuration) {
                const duration = calculateDuration(startTime, endTime);
                setEstimatedDuration(duration.toString());
            }
        }

        // Validate date range
        const dateValidation = validateDateRange(
            startDate ? new Date(startDate).getTime() : undefined,
            dueDate ? new Date(dueDate).getTime() : undefined
        );
        newErrors.push(...dateValidation.errors);
        newWarnings.push(...dateValidation.warnings);

        // Check for time overlaps
        if (startDate && startTime && endTime) {
            const overlapResult = checkTimeOverlaps(
                tasks,
                isEditMode ? taskId : undefined,
                new Date(startDate).getTime(),
                startTime,
                endTime
            );
            setHasTimeOverlap(overlapResult.hasOverlap);
            setOverlappingTasks(overlapResult.overlappingTasks);

            if (overlapResult.hasOverlap) {
                newWarnings.push(
                    `Time slot overlaps with ${overlapResult.overlappingTasks.length} existing task(s)`
                );
            }
        } else {
            setHasTimeOverlap(false);
            setOverlappingTasks([]);
        }

        setErrors(newErrors);
        setWarnings(newWarnings);
    }, [startTime, endTime, startDate, dueDate, tasks, taskId, isEditMode, estimatedDuration]);

    // Auto-calculate end time when duration changes
    const handleDurationChange = (value: string) => {
        setEstimatedDuration(value);
        if (startTime && value) {
            const duration = parseInt(value);
            if (!isNaN(duration) && duration > 0) {
                const calculatedEndTime = calculateEndTime(startTime, duration);
                setEndTime(calculatedEndTime);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (title.trim() && errors.length === 0) {
            if (isEditMode) {
                updateTask(taskId, {
                    title: title.trim(),
                    priority,
                    tags: selectedTags.length > 0 ? selectedTags : undefined,
                    dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
                    startDate: startDate ? new Date(startDate).getTime() : undefined,
                    startTime: startTime || undefined,
                    endTime: endTime || undefined,
                    estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : undefined,
                    notes: notes.trim() || undefined,
                    subDomain: selectedSubDomain,
                    subTasks
                });
            } else {
                addTask(
                    title.trim(),
                    priority,
                    selectedTags.length > 0 ? selectedTags : undefined,
                    dueDate ? new Date(dueDate).getTime() : undefined,
                    notes.trim() || undefined,
                    selectedSubDomain,
                    startDate ? new Date(startDate).getTime() : undefined,
                    startTime || undefined,
                    endTime || undefined,
                    estimatedDuration ? parseInt(estimatedDuration) : undefined
                );
            }
            router.push('/tasks');
        }
    };

    const handleAddSubTask = (subTaskTitle: string) => {
        const newSubTask: SubTask = {
            id: `subtask-${Date.now()}-${Math.random()}`,
            title: subTaskTitle,
            completed: false,
            createdAt: Date.now(),
            order: subTasks.length
        };
        setSubTasks([...subTasks, newSubTask]);
    };

    const handleToggleSubTask = (subTaskId: string) => {
        setSubTasks(subTasks.map(st =>
            st.id === subTaskId
                ? { ...st, completed: !st.completed, completedAt: !st.completed ? Date.now() : undefined }
                : st
        ));
    };

    const handleDeleteSubTask = (subTaskId: string) => {
        setSubTasks(subTasks.filter(st => st.id !== subTaskId));
    };

    const handleReorderSubTasks = (startIndex: number, endIndex: number) => {
        const newSubTasks = [...subTasks];
        const [removed] = newSubTasks.splice(startIndex, 1);
        newSubTasks.splice(endIndex, 0, removed);

        // Update order
        const reorderedSubTasks = newSubTasks.map((st, index) => ({
            ...st,
            order: index
        }));

        setSubTasks(reorderedSubTasks);
    };

    const toggleTag = (tagId: string) => {
        setSelectedTags(prev =>
            prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
        );
    };

    // Filter domains and subdomains based on search
    const filteredDomains = Object.entries(DOMAINS).filter(([domainKey, domainInfo]) => {
        const domainMatch = domainInfo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            domainInfo.description.toLowerCase().includes(searchQuery.toLowerCase());
        const subDomainMatch = Object.values(domainInfo.subDomains).some(subName =>
            subName.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return domainMatch || subDomainMatch;
    });

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
        router.push('/auth/signin');
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="max-w-6xl mx-auto px-6 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">
                            {isEditMode ? 'Edit Task' : 'Create New Task'}
                        </h1>
                        {isEditMode && (
                            <p className="text-sm text-muted-foreground mt-1">
                                Make changes to your task
                            </p>
                        )}
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => router.push('/tasks')}
                    >
                        Cancel
                    </Button>
                </div>

                {/* Error and Warning Messages */}
                {(errors.length > 0 || warnings.length > 0) && (
                    <div className="mb-6 space-y-2">
                        {errors.map((error, index) => (
                            <div
                                key={`error-${index}`}
                                className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-destructive mt-0.5 flex-shrink-0"
                                >
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="15" y1="9" x2="9" y2="15"></line>
                                    <line x1="9" y1="9" x2="15" y2="15"></line>
                                </svg>
                                <span className="text-sm text-destructive">{error}</span>
                            </div>
                        ))}
                        {warnings.map((warning, index) => (
                            <div
                                key={`warning-${index}`}
                                className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-2"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0"
                                >
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                    <line x1="12" y1="9" x2="12" y2="13"></line>
                                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                </svg>
                                <span className="text-sm text-yellow-600 dark:text-yellow-500">{warning}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Overlapping Tasks Warning */}
                {hasTimeOverlap && overlappingTasks.length > 0 && (
                    <div className="mb-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-yellow-600 dark:text-yellow-500 flex items-center gap-2">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                        <line x1="12" y1="9" x2="12" y2="13"></line>
                                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                    </svg>
                                    Time Conflict Detected
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    This time slot overlaps with the following tasks:
                                </p>
                                <div className="space-y-2">
                                    {overlappingTasks.map(task => (
                                        <div
                                            key={task.id}
                                            className="p-2 bg-muted rounded-lg flex items-center justify-between text-sm"
                                        >
                                            <div>
                                                <div className="font-medium">{task.title}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {task.startTime} - {task.endTime}
                                                </div>
                                            </div>
                                            {task.priority && (
                                                <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${
                                                    task.priority === 'high'
                                                        ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                                                        : task.priority === 'medium'
                                                        ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                                                        : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                                                }`}>
                                                    {task.priority}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Task Form */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Task Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Title */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Task Title *</label>
                                        <Input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="What needs to be done?"
                                            required
                                            autoFocus
                                        />
                                    </div>

                                    {/* Selected Category */}
                                    {selectedSubDomain && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Selected Category</label>
                                            <div className="p-3 bg-muted rounded-lg">
                                                <div className="text-sm font-medium">
                                                    {DOMAINS[Object.keys(DOMAINS).find(domain =>
                                                        DOMAINS[domain as Domain].subDomains[selectedSubDomain]
                                                    ) as Domain]?.name}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {DOMAINS[Object.keys(DOMAINS).find(domain =>
                                                        DOMAINS[domain as Domain].subDomains[selectedSubDomain]
                                                    ) as Domain]?.subDomains[selectedSubDomain]}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Priority */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Priority</label>
                                        <div className="flex gap-2">
                                            {(['high', 'medium', 'low'] as Priority[]).map((p) => (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => setPriority(priority === p ? undefined : p)}
                                                    className={`flex-1 p-3 rounded-lg border transition-all ${
                                                        priority === p
                                                            ? 'bg-primary text-primary-foreground border-primary'
                                                            : 'bg-card hover:bg-accent border-border'
                                                    }`}
                                                >
                                                    <div className="text-sm font-medium capitalize">{p}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    {tags.length > 0 && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Tags</label>
                                            <div className="flex flex-wrap gap-2">
                                                {tags.map(tag => (
                                                    <button
                                                        key={tag.id}
                                                        type="button"
                                                        onClick={() => toggleTag(tag.id)}
                                                        className={`px-3 py-1 rounded-full text-sm transition-all ${
                                                            selectedTags.includes(tag.id)
                                                                ? 'bg-primary text-primary-foreground'
                                                                : 'bg-muted hover:bg-accent text-muted-foreground'
                                                        }`}
                                                    >
                                                        {tag.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Scheduling Section */}
                                    <div className="space-y-4 p-4 bg-muted rounded-lg">
                                        <div className="text-sm font-medium flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                                <line x1="3" y1="10" x2="21" y2="10"></line>
                                            </svg>
                                            Schedule & Duration
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {/* Start Date */}
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-muted-foreground">
                                                    Start Date
                                                </label>
                                                <Input
                                                    type="date"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                    min={new Date().toISOString().split('T')[0]}
                                                />
                                            </div>

                                            {/* Due Date */}
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-muted-foreground">
                                                    Due Date
                                                </label>
                                                <Input
                                                    type="date"
                                                    value={dueDate}
                                                    onChange={(e) => setDueDate(e.target.value)}
                                                    min={startDate || new Date().toISOString().split('T')[0]}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {/* Start Time */}
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-muted-foreground">
                                                    Start Time
                                                </label>
                                                <Input
                                                    type="time"
                                                    value={startTime}
                                                    onChange={(e) => setStartTime(e.target.value)}
                                                />
                                            </div>

                                            {/* End Time */}
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-muted-foreground">
                                                    End Time
                                                </label>
                                                <Input
                                                    type="time"
                                                    value={endTime}
                                                    onChange={(e) => setEndTime(e.target.value)}
                                                />
                                            </div>

                                            {/* Estimated Duration */}
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-muted-foreground">
                                                    Duration (min)
                                                </label>
                                                <Input
                                                    type="number"
                                                    value={estimatedDuration}
                                                    onChange={(e) => handleDurationChange(e.target.value)}
                                                    placeholder="25"
                                                    min="1"
                                                    step="5"
                                                />
                                            </div>
                                        </div>

                                        {/* Duration Info */}
                                        {estimatedDuration && (
                                            <div className="text-xs text-muted-foreground bg-background p-2 rounded-lg flex items-start gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
                                                    <circle cx="12" cy="12" r="10"></circle>
                                                    <line x1="12" y1="16" x2="12" y2="12"></line>
                                                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                                </svg>
                                                <span>
                                                    {formatDuration(parseInt(estimatedDuration))} ≈ {estimatePomodoros(parseInt(estimatedDuration))} Pomodoro{estimatePomodoros(parseInt(estimatedDuration)) > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Subtasks */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Subtasks</label>
                                        <SubTaskManager
                                            subTasks={subTasks}
                                            onAdd={handleAddSubTask}
                                            onToggle={handleToggleSubTask}
                                            onDelete={handleDeleteSubTask}
                                            onReorder={handleReorderSubTasks}
                                        />
                                    </div>

                                    {/* Notes */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Notes (Optional)</label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Add any additional details..."
                                            className="w-full px-4 py-2 bg-card text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground resize-none"
                                            rows={4}
                                        />
                                    </div>

                                    {/* Submit Button */}
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => router.push('/tasks')}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={!title.trim() || errors.length > 0}
                                            className="px-8"
                                        >
                                            {isEditMode ? 'Update Task' : 'Create Task'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Categories */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Categories</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <Input
                                        type="text"
                                        placeholder="Search categories..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full"
                                    />

                                    <div className="space-y-4 max-h-96 overflow-y-auto">
                                        {filteredDomains.map(([domainKey, domainInfo]) => (
                                            <div key={domainKey} className="space-y-2">
                                                <div className="text-sm font-medium text-foreground">
                                                    {domainInfo.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {domainInfo.description}
                                                </div>
                                                <div className="space-y-1">
                                                    {Object.entries(domainInfo.subDomains).map(([subDomainKey, subDomainName]) => (
                                                        <button
                                                            key={subDomainKey}
                                                            type="button"
                                                            onClick={() => setSelectedSubDomain(selectedSubDomain === subDomainKey ? undefined : subDomainKey as SubDomain)}
                                                            className={`w-full p-2 text-left text-sm rounded-lg transition-all ${
                                                                selectedSubDomain === subDomainKey
                                                                    ? 'bg-primary text-primary-foreground'
                                                                    : 'bg-card hover:bg-accent text-card-foreground'
                                                            }`}
                                                        >
                                                            {subDomainName}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
