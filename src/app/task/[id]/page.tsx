'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '@/components/layout/Header';
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

type WizardStep = 'basics' | 'schedule' | 'organize';

export default function TaskPage() {
    const router = useRouter();
    const params = useParams();
    const taskId = params.id as string;
    const isEditMode = taskId && taskId !== 'new';

    const { data: session, status } = useSession();
    const { tasks, addTask, updateTask } = useTasks();
    const { tags } = useTags();

    // Wizard state
    const [currentStep, setCurrentStep] = useState<WizardStep>('basics');
    const [completedSteps, setCompletedSteps] = useState<WizardStep[]>([]);

    // Form state
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

    // Validate current step
    useEffect(() => {
        const newErrors: string[] = [];
        const newWarnings: string[] = [];

        if (currentStep === 'basics') {
            if (!title.trim()) {
                newErrors.push('Task title is required');
            }
        }

        if (currentStep === 'schedule') {
            if (startTime && endTime) {
                const timeValidation = validateTimeRange(startTime, endTime);
                newErrors.push(...timeValidation.errors);
                newWarnings.push(...timeValidation.warnings);

                if (timeValidation.valid && !estimatedDuration) {
                    const duration = calculateDuration(startTime, endTime);
                    setEstimatedDuration(duration.toString());
                }
            }

            const dateValidation = validateDateRange(
                startDate ? new Date(startDate).getTime() : undefined,
                dueDate ? new Date(dueDate).getTime() : undefined
            );
            newErrors.push(...dateValidation.errors);
            newWarnings.push(...dateValidation.warnings);
        }

        setErrors(newErrors);
        setWarnings(newWarnings);
    }, [currentStep, title, startTime, endTime, startDate, dueDate, estimatedDuration]);

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

    const canProceedToNextStep = () => {
        if (currentStep === 'basics') {
            return title.trim().length > 0;
        }
        return errors.length === 0;
    };

    const handleNextStep = () => {
        if (!canProceedToNextStep()) return;

        if (!completedSteps.includes(currentStep)) {
            setCompletedSteps([...completedSteps, currentStep]);
        }

        if (currentStep === 'basics') setCurrentStep('schedule');
        else if (currentStep === 'schedule') setCurrentStep('organize');
    };

    const handlePrevStep = () => {
        if (currentStep === 'organize') setCurrentStep('schedule');
        else if (currentStep === 'schedule') setCurrentStep('basics');
    };

    const handleSubmit = () => {
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
        const reorderedSubTasks = newSubTasks.map((st, index) => ({ ...st, order: index }));
        setSubTasks(reorderedSubTasks);
    };

    const toggleTag = (tagId: string) => {
        setSelectedTags(prev =>
            prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
        );
    };

    const filteredDomains = Object.entries(DOMAINS).filter(([domainKey, domainInfo]) => {
        const domainMatch = domainInfo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            domainInfo.description.toLowerCase().includes(searchQuery.toLowerCase());
        const subDomainMatch = Object.values(domainInfo.subDomains).some(subName =>
            subName.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return domainMatch || subDomainMatch;
    });

    const getPriorityConfig = (p: Priority) => {
        const configs = {
            high: {
                color: 'from-red-500 to-orange-500',
                icon: '🔥',
                label: 'High Priority',
                bg: 'bg-red-500/10 border-red-500/30'
            },
            medium: {
                color: 'from-yellow-500 to-amber-500',
                icon: '⚡',
                label: 'Medium Priority',
                bg: 'bg-yellow-500/10 border-yellow-500/30'
            },
            low: {
                color: 'from-blue-500 to-cyan-500',
                icon: '💫',
                label: 'Low Priority',
                bg: 'bg-blue-500/10 border-blue-500/30'
            }
        };
        return configs[p];
    };

    const stepConfig = {
        basics: { icon: '✨', label: 'Basics', color: 'from-purple-500 to-pink-500' },
        schedule: { icon: '⏰', label: 'Schedule', color: 'from-blue-500 to-cyan-500' },
        organize: { icon: '🎯', label: 'Organize', color: 'from-green-500 to-emerald-500' }
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
                        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary/40 rounded-full animate-ping mx-auto"></div>
                    </div>
                    <p className="text-muted-foreground animate-pulse">Loading...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        router.push('/auth/signin');
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
            <Header />

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                {/* Header with animated gradient */}
                <div className="mb-8 text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/30 backdrop-blur-sm">
                        <span className="text-2xl animate-bounce">{stepConfig[currentStep].icon}</span>
                        <span className="text-sm font-medium bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                            {isEditMode ? 'Edit Your Task' : 'Create Amazing Task'}
                        </span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
                        {stepConfig[currentStep].label}
                    </h1>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                        {currentStep === 'basics' && 'Start with the essentials - what needs to be done?'}
                        {currentStep === 'schedule' && 'When do you want to tackle this task?'}
                        {currentStep === 'organize' && 'Organize and break it down into smaller pieces'}
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="mb-12">
                    <div className="flex items-center justify-center gap-4">
                        {(['basics', 'schedule', 'organize'] as WizardStep[]).map((step, index) => {
                            const isActive = currentStep === step;
                            const isCompleted = completedSteps.includes(step);
                            const config = stepConfig[step];

                            return (
                                <div key={step} className="flex items-center">
                                    <button
                                        onClick={() => {
                                            if (isCompleted || index === 0) {
                                                setCurrentStep(step);
                                            }
                                        }}
                                        className={`relative group transition-all duration-300 ${
                                            isCompleted || isActive ? 'scale-100' : 'scale-90 opacity-50'
                                        }`}
                                        disabled={!isCompleted && !isActive && index !== 0}
                                    >
                                        <div className={`
                                            w-14 h-14 rounded-2xl flex items-center justify-center
                                            transition-all duration-300 transform
                                            ${isActive
                                                ? `bg-gradient-to-br ${config.color} shadow-lg shadow-primary/50 scale-110`
                                                : isCompleted
                                                ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                                                : 'bg-muted border-2 border-border'
                                            }
                                            hover:scale-105
                                        `}>
                                            <span className={`text-2xl ${isActive || isCompleted ? 'animate-bounce' : ''}`}>
                                                {isCompleted ? '✓' : config.icon}
                                            </span>
                                        </div>
                                        <div className={`
                                            absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap
                                            text-xs font-medium transition-all duration-300
                                            ${isActive ? 'text-primary' : 'text-muted-foreground'}
                                        `}>
                                            {config.label}
                                        </div>
                                    </button>
                                    {index < 2 && (
                                        <div className={`
                                            w-16 h-1 mx-2 rounded-full transition-all duration-500
                                            ${completedSteps.includes((['basics', 'schedule', 'organize'] as WizardStep[])[index])
                                                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                                : 'bg-border'
                                            }
                                        `} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Main Content Card with Glassmorphism */}
                <div className="relative">
                    {/* Animated background blobs */}
                    <div className="absolute inset-0 -z-10 overflow-hidden rounded-3xl">
                        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"></div>
                        <div className="absolute bottom-0 -right-4 w-72 h-72 bg-pink-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse delay-1000"></div>
                    </div>

                    <div className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-3xl shadow-2xl overflow-hidden">
                        <div className="p-8 sm:p-12">
                            {/* Step 1: Basics */}
                            {currentStep === 'basics' && (
                                <div className="space-y-8 animate-fadeIn">
                                    {/* Title Input */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                            Task Title *
                                        </label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="What amazing thing will you accomplish?"
                                            autoFocus
                                            className="w-full px-6 py-4 text-2xl font-bold bg-muted/50 text-foreground border-2 border-transparent focus:border-primary rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/20 placeholder:text-muted-foreground/40 transition-all"
                                        />
                                    </div>

                                    {/* Priority Selection */}
                                    <div className="space-y-4">
                                        <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                            Priority Level
                                        </label>
                                        <div className="grid grid-cols-3 gap-4">
                                            {(['high', 'medium', 'low'] as Priority[]).map((p) => {
                                                const config = getPriorityConfig(p);
                                                const isSelected = priority === p;
                                                return (
                                                    <button
                                                        key={p}
                                                        type="button"
                                                        onClick={() => setPriority(isSelected ? undefined : p)}
                                                        className={`
                                                            group relative p-6 rounded-2xl border-2 transition-all duration-300
                                                            ${isSelected
                                                                ? `${config.bg} border-current scale-105 shadow-lg`
                                                                : 'bg-muted/30 border-border hover:border-primary/50 hover:scale-102'
                                                            }
                                                        `}
                                                    >
                                                        <div className="text-center space-y-2">
                                                            <div className={`text-4xl transition-transform duration-300 ${
                                                                isSelected ? 'scale-110 animate-bounce' : 'group-hover:scale-110'
                                                            }`}>
                                                                {config.icon}
                                                            </div>
                                                            <div className={`text-sm font-semibold ${
                                                                isSelected ? `bg-gradient-to-r ${config.color} bg-clip-text text-transparent` : ''
                                                            }`}>
                                                                {p.charAt(0).toUpperCase() + p.slice(1)}
                                                            </div>
                                                        </div>
                                                        {isSelected && (
                                                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                                                                <span className="text-white text-xs">✓</span>
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                            Notes & Details
                                        </label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Add context, requirements, or anything that helps..."
                                            className="w-full px-6 py-4 bg-muted/50 text-foreground border-2 border-transparent focus:border-primary rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/20 placeholder:text-muted-foreground/40 resize-none transition-all"
                                            rows={4}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Schedule */}
                            {currentStep === 'schedule' && (
                                <div className="space-y-8 animate-fadeIn">
                                    {/* Date Range */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                                <span>📅</span> Start Date
                                            </label>
                                            <Input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                                className="h-14 text-lg rounded-2xl"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                                <span>🎯</span> Due Date
                                            </label>
                                            <Input
                                                type="date"
                                                value={dueDate}
                                                onChange={(e) => setDueDate(e.target.value)}
                                                min={startDate || new Date().toISOString().split('T')[0]}
                                                className="h-14 text-lg rounded-2xl"
                                            />
                                        </div>
                                    </div>

                                    {/* Time & Duration */}
                                    <div className="space-y-4">
                                        <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                            <span>⏰</span> Time Window
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs text-muted-foreground">Start Time</label>
                                                <Input
                                                    type="time"
                                                    value={startTime}
                                                    onChange={(e) => setStartTime(e.target.value)}
                                                    className="h-12 rounded-xl"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs text-muted-foreground">End Time</label>
                                                <Input
                                                    type="time"
                                                    value={endTime}
                                                    onChange={(e) => setEndTime(e.target.value)}
                                                    className="h-12 rounded-xl"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs text-muted-foreground">Duration (min)</label>
                                                <Input
                                                    type="number"
                                                    value={estimatedDuration}
                                                    onChange={(e) => handleDurationChange(e.target.value)}
                                                    placeholder="25"
                                                    min="1"
                                                    step="5"
                                                    className="h-12 rounded-xl"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pomodoro Estimate */}
                                    {estimatedDuration && parseInt(estimatedDuration) > 0 && (
                                        <div className="p-6 bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/30 rounded-2xl">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                                                    <span className="text-3xl">🍅</span>
                                                </div>
                                                <div>
                                                    <div className="text-2xl font-bold">
                                                        {estimatePomodoros(parseInt(estimatedDuration))} Pomodoro{estimatePomodoros(parseInt(estimatedDuration)) > 1 ? 's' : ''}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {formatDuration(parseInt(estimatedDuration))} of focused work
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Validation Messages */}
                                    {(errors.length > 0 || warnings.length > 0) && (
                                        <div className="space-y-2">
                                            {errors.map((error, i) => (
                                                <div key={`error-${i}`} className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                                                    <span className="text-xl">❌</span>
                                                    <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
                                                </div>
                                            ))}
                                            {warnings.map((warning, i) => (
                                                <div key={`warning-${i}`} className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-3">
                                                    <span className="text-xl">⚠️</span>
                                                    <span className="text-sm text-yellow-600 dark:text-yellow-400">{warning}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Step 3: Organize */}
                            {currentStep === 'organize' && (
                                <div className="space-y-8 animate-fadeIn">
                                    {/* Tags */}
                                    {tags.length > 0 && (
                                        <div className="space-y-4">
                                            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                                <span>🏷️</span> Tags
                                            </label>
                                            <div className="flex flex-wrap gap-3">
                                                {tags.map(tag => (
                                                    <button
                                                        key={tag.id}
                                                        type="button"
                                                        onClick={() => toggleTag(tag.id)}
                                                        className={`
                                                            px-6 py-3 rounded-full text-sm font-medium transition-all duration-300
                                                            ${selectedTags.includes(tag.id)
                                                                ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg scale-105'
                                                                : 'bg-muted hover:bg-accent border-2 border-border hover:border-primary/50'
                                                            }
                                                        `}
                                                    >
                                                        {selectedTags.includes(tag.id) && <span className="mr-2">✓</span>}
                                                        {tag.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Category Selection */}
                                    <div className="space-y-4">
                                        <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                            <span>📂</span> Category
                                        </label>
                                        <Input
                                            type="text"
                                            placeholder="Search categories..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="h-12 rounded-xl"
                                        />
                                        <div className="grid grid-cols-1 gap-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                            {filteredDomains.map(([domainKey, domainInfo]) => (
                                                <div key={domainKey} className="space-y-3">
                                                    <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                        <span className="text-lg">📁</span>
                                                        {domainInfo.name}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 pl-6">
                                                        {Object.entries(domainInfo.subDomains).map(([subDomainKey, subDomainName]) => (
                                                            <button
                                                                key={subDomainKey}
                                                                type="button"
                                                                onClick={() => setSelectedSubDomain(
                                                                    selectedSubDomain === subDomainKey ? undefined : subDomainKey as SubDomain
                                                                )}
                                                                className={`
                                                                    p-3 text-left text-sm rounded-xl transition-all duration-300
                                                                    ${selectedSubDomain === subDomainKey
                                                                        ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg scale-105'
                                                                        : 'bg-muted hover:bg-accent border border-border hover:border-primary/50'
                                                                    }
                                                                `}
                                                            >
                                                                {selectedSubDomain === subDomainKey && <span className="mr-2">✓</span>}
                                                                {subDomainName}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Subtasks */}
                                    <div className="space-y-4">
                                        <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                            <span>✅</span> Break It Down
                                        </label>
                                        <div className="p-6 bg-muted/30 rounded-2xl border-2 border-dashed border-border">
                                            <SubTaskManager
                                                subTasks={subTasks}
                                                onAdd={handleAddSubTask}
                                                onToggle={handleToggleSubTask}
                                                onDelete={handleDeleteSubTask}
                                                onReorder={handleReorderSubTasks}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Navigation Footer */}
                        <div className="px-8 sm:px-12 py-6 bg-muted/30 border-t border-border/50">
                            <div className="flex items-center justify-between gap-4">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        if (currentStep === 'basics') {
                                            router.push('/tasks');
                                        } else {
                                            handlePrevStep();
                                        }
                                    }}
                                    className="px-8 h-12 rounded-xl"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                        <polyline points="15 18 9 12 15 6"></polyline>
                                    </svg>
                                    {currentStep === 'basics' ? 'Cancel' : 'Back'}
                                </Button>

                                {currentStep !== 'organize' ? (
                                    <Button
                                        onClick={handleNextStep}
                                        disabled={!canProceedToNextStep()}
                                        className="px-8 h-12 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:shadow-lg hover:shadow-primary/50 transition-all"
                                    >
                                        Next Step
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                                            <polyline points="9 18 15 12 9 6"></polyline>
                                        </svg>
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={!title.trim() || errors.length > 0}
                                        className="px-8 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg hover:shadow-green-500/50 transition-all"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                        {isEditMode ? 'Update Task' : 'Create Task'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress Summary */}
                <div className="mt-8 text-center text-sm text-muted-foreground">
                    Step {(['basics', 'schedule', 'organize'] as WizardStep[]).indexOf(currentStep) + 1} of 3 •
                    {completedSteps.length > 0 && ` ${completedSteps.length} completed`}
                </div>
            </main>

            {/* Custom scrollbar styles */}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: hsl(var(--border));
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: hsl(var(--primary) / 0.5);
                }
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out;
                }
            `}</style>
        </div>
    );
}
