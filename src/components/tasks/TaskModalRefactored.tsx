/**
 * @fileoverview Refactored TaskModal component - Simplified version.
 * Uses sub-components for better maintainability.
 */

'use client';

import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import { Priority, SubDomain, DOMAINS, Domain, Tag } from '@/types';
import { TaskModalBasicInfo } from './TaskModalBasicInfo';
import { TaskModalDates } from './TaskModalDates';
import { TaskModalRecurrence } from './TaskModalRecurrence';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (taskData: TaskFormData) => void;
    initialData?: TaskFormData;
    tags: Tag[];
}

export interface TaskFormData {
    title: string;
    priority?: Priority;
    tags?: string[];
    dueDate?: number;
    startDate?: number;
    startTime?: string;
    endTime?: string;
    estimatedDuration?: number;
    notes?: string;
    subDomain?: SubDomain;
    subTasks?: { title: string; completed: boolean }[];
    // Recurrence fields
    isRecurring?: boolean;
    recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'custom';
    recurrenceInterval?: number;
    recurrenceDaysOfWeek?: number[];
    recurrenceEndDate?: string;
}

/**
 * Simplified TaskModal component using sub-components for better maintainability.
 */
export default function TaskModalRefactored({
    isOpen,
    onClose,
    onSave,
    initialData,
    tags,
}: TaskModalProps) {
    const [formData, setFormData] = useState<TaskFormData>({
        title: '',
        priority: undefined,
        tags: [],
        notes: '',
        subTasks: [],
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'categories' | 'subtasks' | 'recurrence'>('details');
    const [newSubTask, setNewSubTask] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
    const [isSubTasksOpen, setIsSubTasksOpen] = useState(false);

    // Populate form with initial data
    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || '',
                priority: initialData.priority,
                tags: initialData.tags || [],
                notes: initialData.notes,
                subDomain: initialData.subDomain,
                subTasks: initialData.subTasks || [],
                dueDate: initialData.dueDate,
                startDate: initialData.startDate,
                startTime: initialData.startTime,
                endTime: initialData.endTime,
                estimatedDuration: initialData.estimatedDuration,
                isRecurring: initialData.isRecurring,
                recurrencePattern: initialData.recurrencePattern,
                recurrenceInterval: initialData.recurrenceInterval,
                recurrenceDaysOfWeek: initialData.recurrenceDaysOfWeek,
                recurrenceEndDate: initialData.recurrenceEndDate,
            });
        } else {
            setFormData({
                title: '',
                priority: undefined,
                tags: [],
                notes: '',
                subTasks: [],
            });
        }
        setErrors({});
        setActiveTab('details');
        setNewSubTask('');
        setSearchQuery('');
    }, [initialData, isOpen]);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleDurationChange = (duration: string) => {
        setFormData(prev => ({ ...prev, estimatedDuration: duration ? parseInt(duration) : undefined }));
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.title?.trim()) {
            newErrors.title = 'Title is required';
        }

        // Validate dates
        if (formData.startDate && formData.dueDate) {
            const startDate = typeof formData.startDate === 'number'
                ? formData.startDate
                : new Date(formData.startDate).getTime();
            const dueDate = typeof formData.dueDate === 'number'
                ? formData.dueDate
                : new Date(formData.dueDate).getTime();

            if (startDate > dueDate) {
                newErrors.dates = 'Start date must be before due date';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;

        onSave({
            title: formData.title.trim(),
            priority: formData.priority,
            tags: formData.tags && formData.tags.length > 0 ? formData.tags : undefined,
            dueDate: formData.dueDate,
            startDate: formData.startDate,
            startTime: formData.startTime || undefined,
            endTime: formData.endTime || undefined,
            estimatedDuration: formData.estimatedDuration,
            notes: formData.notes?.trim() || undefined,
            subDomain: formData.subDomain,
            subTasks: formData.subTasks && formData.subTasks.length > 0 ? formData.subTasks : undefined,
            isRecurring: formData.isRecurring,
            recurrencePattern: formData.recurrencePattern,
            recurrenceInterval: formData.recurrenceInterval,
            recurrenceDaysOfWeek: formData.recurrenceDaysOfWeek,
            recurrenceEndDate: formData.recurrenceEndDate,
        });

        onClose();
    };

    const toggleTag = (tagId: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags?.includes(tagId)
                ? prev.tags.filter(id => id !== tagId)
                : [...(prev.tags || []), tagId]
        }));
    };

    const addSubTask = () => {
        if (newSubTask.trim()) {
            setFormData(prev => ({
                ...prev,
                subTasks: [...(prev.subTasks || []), { title: newSubTask.trim(), completed: false }]
            }));
            setNewSubTask('');
        }
    };

    const toggleSubTask = (index: number) => {
        setFormData(prev => ({
            ...prev,
            subTasks: prev.subTasks?.map((task, i) =>
                i === index ? { ...task, completed: !task.completed } : task
            )
        }));
    };

    const removeSubTask = (index: number) => {
        setFormData(prev => ({
            ...prev,
            subTasks: prev.subTasks?.filter((_, i) => i !== index)
        }));
    };

    const filteredDomains = Object.entries(DOMAINS).filter(([domainKey, domainInfo]) => {
        const domainMatch = domainInfo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            domainInfo.description.toLowerCase().includes(searchQuery.toLowerCase());
        const subDomainMatch = Object.values(domainInfo.subDomains).some(subName =>
            subName.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return domainMatch || subDomainMatch;
    });

    const priorityOptions = [
        { value: 'high' as Priority, label: 'High', color: 'bg-error text-white' },
        { value: 'medium' as Priority, label: 'Medium', color: 'bg-warning text-white' },
        { value: 'low' as Priority, label: 'Low', color: 'bg-info text-white' },
    ];

    if (!isOpen) return null;

    const modalClasses = isFullScreen
        ? "fixed inset-0 z-50 bg-background"
        : "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm";

    const contentClasses = isFullScreen
        ? "w-full h-full bg-card border-0 rounded-none shadow-none overflow-y-auto"
        : "w-full max-w-2xl max-h-[90vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden";

    // Prepare date values for sub-components
    const dateValues = {
        startDate: formData.startDate ? new Date(formData.startDate).toISOString().split('T')[0] : '',
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString().split('T')[0] : '',
        startTime: formData.startTime || '',
        endTime: formData.endTime || '',
        estimatedDuration: formData.estimatedDuration?.toString() || '',
    };

    return (
        <div className={modalClasses}>
            <div className={contentClasses}>
                {/* Header */}
                <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between z-10">
                    <h2 className="text-xl font-semibold text-foreground">
                        {initialData ? 'Edit Task' : 'Create New Task'}
                    </h2>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsFullScreen(!isFullScreen)}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all cursor-pointer"
                            title={isFullScreen ? 'Compact mode' : 'Full screen mode'}
                        >
                            {isFullScreen ? (
                                <svg className="w-5 h-5" viewBox="0 0 32 32" fill="currentColor">
                                    <path d="M30.706 2.706 21.413 12h7.586a1 1 0 0 1 0 2h-10a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v7.586l9.293-9.293a.999.999 0 1 1 1.413 1.414Zm-29.414 28a.997.997 0 0 0 1.414 0l9.293-9.293v7.586a1 1 0 0 0 2 0V19a1 1 0 0 0-1-1h-10a1 1 0 0 0 0 2h7.586l-9.293 9.293a.999.999 0 0 0 0 1.414Z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Tab Navigation (Compact Mode Only) */}
                {!isFullScreen && (
                    <div className="sticky top-[89px] bg-card border-b border-border px-6 z-10">
                        <div className="flex">
                            {[
                                { id: 'details', label: 'Details' },
                                { id: 'categories', label: 'Categories', badge: formData.subDomain ? '1' : null },
                                { id: 'subtasks', label: 'Subtasks', badge: formData.subTasks && formData.subTasks.length > 0 ? formData.subTasks.length.toString() : null },
                                { id: 'recurrence', label: 'Recurrence', badge: formData.isRecurring ? '✓' : null }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex-1 cursor-pointer flex items-center justify-center gap-2 py-2 text-sm font-medium transition-all border-b-2 ${activeTab === tab.id
                                        ? 'text-primary border-primary bg-primary/5'
                                        : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-accent/50'
                                        }`}
                                >
                                    <span>{tab.label}</span>
                                    {tab.badge && (
                                        <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                                            {tab.badge}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className={`${isFullScreen ? 'p-6 space-y-8' : ''}`}>
                    {!isFullScreen && (
                        <div className="h-[calc(90vh-200px)] overflow-y-auto p-6 space-y-8">
                            {activeTab === 'details' && (
                                <>
                                    <TaskModalBasicInfo
                                        task={{ title: formData.title, notes: formData.notes }}
                                        onChange={handleChange}
                                        errors={errors}
                                    />

                                    {/* Priority */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            {priorityOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => handleChange('priority', formData.priority === option.value ? undefined : option.value)}
                                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${formData.priority === option.value
                                                        ? `${option.color} scale-105 shadow-md`
                                                        : 'bg-muted hover:bg-accent text-muted-foreground hover:text-foreground'
                                                        }`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    {tags.length > 0 && (
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap gap-2">
                                                {tags.map(tag => (
                                                    <button
                                                        key={tag.id}
                                                        type="button"
                                                        onClick={() => toggleTag(tag.id)}
                                                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all cursor-pointer ${formData.tags?.includes(tag.id)
                                                            ? 'bg-primary text-primary-foreground scale-105'
                                                            : 'bg-muted hover:bg-accent text-muted-foreground hover:text-foreground'
                                                            }`}
                                                    >
                                                        {tag.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <TaskModalDates
                                        task={dateValues}
                                        onChange={(field, value) => {
                                            if (field === 'startDate' || field === 'dueDate') {
                                                handleChange(field, value ? new Date(value).getTime() : undefined);
                                            } else {
                                                handleChange(field, value);
                                            }
                                        }}
                                        onDurationChange={handleDurationChange}
                                        errors={errors}
                                    />
                                </>
                            )}

                            {activeTab === 'recurrence' && (
                                <TaskModalRecurrence
                                    task={{
                                        isRecurring: formData.isRecurring,
                                        recurrencePattern: formData.recurrencePattern,
                                        recurrenceInterval: formData.recurrenceInterval,
                                        recurrenceDaysOfWeek: formData.recurrenceDaysOfWeek,
                                        recurrenceEndDate: formData.recurrenceEndDate,
                                    }}
                                    onChange={handleChange}
                                />
                            )}

                            {/* Other tabs omitted for brevity - keep existing implementation */}
                        </div>
                    )}

                    {isFullScreen && (
                        <div className="space-y-8">
                            <TaskModalBasicInfo
                                task={{ title: formData.title, notes: formData.notes }}
                                onChange={handleChange}
                                errors={errors}
                            />

                            {/* Priority and Tags - Keep existing */}

                            <TaskModalDates
                                task={dateValues}
                                onChange={(field, value) => {
                                    if (field === 'startDate' || field === 'dueDate') {
                                        handleChange(field, value ? new Date(value).getTime() : undefined);
                                    } else {
                                        handleChange(field, value);
                                    }
                                }}
                                onDurationChange={handleDurationChange}
                                errors={errors}
                            />

                            <div className="border-t border-border"></div>

                            <TaskModalRecurrence
                                task={{
                                    isRecurring: formData.isRecurring,
                                    recurrencePattern: formData.recurrencePattern,
                                    recurrenceInterval: formData.recurrenceInterval,
                                    recurrenceDaysOfWeek: formData.recurrenceDaysOfWeek,
                                    recurrenceEndDate: formData.recurrenceEndDate,
                                }}
                                onChange={handleChange}
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-card border-t border-border p-6 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={!formData.title.trim()}
                    >
                        {initialData ? 'Save Changes' : 'Create Task'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
