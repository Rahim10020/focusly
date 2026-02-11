/**
 * @fileoverview TaskDetailsModal component for viewing and editing task details.
 */

'use client';

import { useState } from 'react';
import { Task, Tag, Priority, SubDomain } from '@/types';
import TaskModalHeader from './TaskModalHeader';
import TaskModalTabs from './TaskModalTabs';
import TaskModalDetails from './TaskModalDetails';
import TaskModalFullscreen from './TaskModalFullscreen';
import CategorySelector from './CategorySelector';
import { TaskMetaInfo } from './TaskMetaInfo';
import { SubTaskList } from './SubTaskList';
import Button from '@/components/ui/Button';

interface TaskDetailsModalProps {
    task: Task;
    tags: Tag[];
    onClose: () => void;
    onUpdate: (updates: Partial<Task>) => void;
    onAddSubTask: (title: string) => void;
    onToggleSubTask: (subTaskId: string) => void;
    onDeleteSubTask: (subTaskId: string) => void;
}

export default function TaskDetailsModal({
    task,
    tags,
    onClose,
    onUpdate,
    onAddSubTask,
    onToggleSubTask,
    onDeleteSubTask,
}: TaskDetailsModalProps) {
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [title, setTitle] = useState(task.title || '');
    const [notes, setNotes] = useState(task.notes || '');
    const [priority, setPriority] = useState<Priority | undefined>(task.priority);
    const [selectedTags, setSelectedTags] = useState<string[]>(task.tags || []);
    const [dueDate, setDueDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    const [startDate, setStartDate] = useState(task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '');
    const [startTime, setStartTime] = useState(task.startTime || '');
    const [endTime, setEndTime] = useState(task.endTime || '');
    const [estimatedDuration, setEstimatedDuration] = useState(task.estimatedDuration?.toString() || '');
    const [selectedSubDomain, setSelectedSubDomain] = useState<SubDomain | undefined>(task.subDomain);
    const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
    const [isSubTasksOpen, setIsSubTasksOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'details' | 'categories' | 'subtasks'>('details');

    const calculateDuration = (start: string, end: string) => {
        if (!start || !end) return null;

        try {
            const startValue = start.includes(':') ? start : `${start}:00`;
            const endValue = end.includes(':') ? end : `${end}:00`;
            const [startHours, startMinutes = 0] = startValue.split(':').map(Number);
            const [endHours, endMinutes = 0] = endValue.split(':').map(Number);

            if (isNaN(startHours) || isNaN(startMinutes) || isNaN(endHours) || isNaN(endMinutes)) return null;

            const startDateObj = new Date();
            startDateObj.setHours(startHours, startMinutes, 0, 0);
            const endDateObj = new Date();
            endDateObj.setHours(endHours, endMinutes, 0, 0);

            if (endDateObj <= startDateObj) {
                endDateObj.setDate(endDateObj.getDate() + 1);
            }

            const diffInMs = endDateObj.getTime() - startDateObj.getTime();
            const diffInMinutes = Math.round(diffInMs / (1000 * 60));

            if (diffInMinutes > 0) return diffInMinutes.toString();
            if (diffInMinutes < 0) return '';
            return null;
        } catch (error) {
            console.error('Error calculating duration:', error);
            return null;
        }
    };

    const handleStartTimeChange = (value: string) => {
        setStartTime(value);
        const duration = calculateDuration(value, endTime);
        if (duration !== null) setEstimatedDuration(duration);
    };

    const handleEndTimeChange = (value: string) => {
        setEndTime(value);
        const duration = calculateDuration(startTime, value);
        if (duration !== null) setEstimatedDuration(duration);
    };

    const handleSave = () => {
        onUpdate({
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
        });
    };

    const toggleTag = (tagId: string) => {
        setSelectedTags(prev =>
            prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
        );
    };


    if (!task) return null;

    const modalClasses = isFullScreen
        ? "fixed inset-0 z-50 bg-background"
        : "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm";
    const contentClasses = isFullScreen
        ? "w-full h-full bg-card border-0 rounded-none shadow-none overflow-y-auto"
        : "w-full max-w-2xl max-h-[90vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden";

    return (
        <div className={modalClasses}>
            <div className={contentClasses}>
                <TaskModalHeader
                    isEditing={true}
                    isFullScreen={isFullScreen}
                    onFullScreenToggle={() => setIsFullScreen(!isFullScreen)}
                    onClose={onClose}
                />

                {!isFullScreen && (
                    <TaskModalTabs
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        selectedSubDomain={selectedSubDomain}
                        subTasksCount={task.subTasks?.length || 0}
                    />
                )}

                <div className={`${isFullScreen ? 'grid grid-cols-[1fr_1fr] gap-8' : ''}`}>
                    <div className={`${isFullScreen ? 'p-6 space-y-8' : ''}`}>
                        {!isFullScreen && (
                            <div className="h-[calc(90vh-200px)] overflow-y-auto">
                                {activeTab === 'details' && (
                                    <div className="p-6 space-y-8">
                                        <TaskModalDetails
                                            title={title}
                                            priority={priority}
                                            tags={tags}
                                            selectedTags={selectedTags}
                                            startDate={startDate}
                                            dueDate={dueDate}
                                            startTime={startTime}
                                            endTime={endTime}
                                            estimatedDuration={estimatedDuration}
                                            notes={notes}
                                            onTitleChange={setTitle}
                                            onPriorityChange={setPriority}
                                            onTagsToggle={toggleTag}
                                            onStartDateChange={setStartDate}
                                            onDueDateChange={setDueDate}
                                            onStartTimeChange={handleStartTimeChange}
                                            onEndTimeChange={handleEndTimeChange}
                                            onDurationChange={setEstimatedDuration}
                                            onNotesChange={setNotes}
                                        />
                                        <TaskMetaInfo
                                            createdAt={task.createdAt}
                                            completedAt={task.completedAt}
                                            pomodoroCount={task.pomodoroCount}
                                        />
                                    </div>
                                )}
                                {activeTab === 'categories' && (
                                    <div className="p-6 space-y-4">
                                        <CategorySelector
                                            selectedSubDomain={selectedSubDomain}
                                            onChange={setSelectedSubDomain}
                                            searchQuery={searchQuery}
                                            onSearchChange={setSearchQuery}
                                        />
                                    </div>
                                )}
                                {activeTab === 'subtasks' && (
                                    <SubTaskList
                                        subTasks={task.subTasks || []}
                                        onToggleSubTask={onToggleSubTask}
                                        onDeleteSubTask={onDeleteSubTask}
                                        onAddSubTask={onAddSubTask}
                                    />
                                )}
                            </div>
                        )}
                        {isFullScreen && (
                            <div className="p-6 space-y-8">
                                <TaskModalFullscreen
                                    title={title}
                                    priority={priority}
                                    tags={tags}
                                    selectedTags={selectedTags}
                                    startDate={startDate}
                                    dueDate={dueDate}
                                    startTime={startTime}
                                    endTime={endTime}
                                    estimatedDuration={estimatedDuration}
                                    notes={notes}
                                    selectedSubDomain={selectedSubDomain}
                                    subTasks={task.subTasks || []}
                                    searchQuery={searchQuery}
                                    isCategoriesOpen={isCategoriesOpen}
                                    isSubTasksOpen={isSubTasksOpen}
                                    onTitleChange={setTitle}
                                    onPriorityChange={setPriority}
                                    onTagsToggle={toggleTag}
                                    onStartDateChange={setStartDate}
                                    onDueDateChange={setDueDate}
                                    onStartTimeChange={handleStartTimeChange}
                                    onEndTimeChange={handleEndTimeChange}
                                    onDurationChange={setEstimatedDuration}
                                    onNotesChange={setNotes}
                                    onSubDomainChange={setSelectedSubDomain}
                                    onSubTasksChange={() => {}}
                                    onSearchChange={setSearchQuery}
                                    onCategoriesToggle={() => setIsCategoriesOpen(!isCategoriesOpen)}
                                    onSubTasksToggle={() => setIsSubTasksOpen(!isSubTasksOpen)}
                                />
                                <TaskMetaInfo
                                    createdAt={task.createdAt}
                                    completedAt={task.completedAt}
                                    pomodoroCount={task.pomodoroCount}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="sticky bottom-0 bg-card border-t border-border p-6 flex justify-between gap-3">
                    <Button onClick={() => { onUpdate({ completed: !task.completed }); onClose(); }} variant="secondary">
                        {task.completed ? 'Mark as Incomplete' : 'Mark as Complete'}
                    </Button>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button variant="primary" onClick={() => { handleSave(); onClose(); }}>Save Changes</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
