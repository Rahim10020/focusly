'use client';

import { useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Tag, Priority } from '@/types';
import TagBadge from '@/components/ui/TagBadge';
import PriorityBadge from '@/components/ui/PriorityBadge';

interface TaskFormProps {
    onAddTask: (title: string, priority?: Priority, tags?: string[], dueDate?: number, notes?: string) => void;
    availableTags: Tag[];
}

export default function TaskForm({ onAddTask, availableTags }: TaskFormProps) {
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState<Priority | undefined>(undefined);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [dueDate, setDueDate] = useState('');
    const [notes, setNotes] = useState('');
    const [showOptions, setShowOptions] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            onAddTask(
                title.trim(),
                priority,
                selectedTags.length > 0 ? selectedTags : undefined,
                dueDate ? new Date(dueDate).getTime() : undefined,
                notes.trim() || undefined
            );
            setTitle('');
            setPriority(undefined);
            setSelectedTags([]);
            setDueDate('');
            setNotes('');
            setShowOptions(false);
        }
    };

    const toggleTag = (tagId: string) => {
        setSelectedTags(prev =>
            prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
        );
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
                <Input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Add a new task..."
                    className="flex-1"
                />
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowOptions(!showOptions)}
                    className="px-3"
                    title="More options"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M12 1v6m0 6v6m-5-7H1m6 0h6m6 0h6"></path>
                    </svg>
                </Button>
                <Button type="submit" disabled={!title.trim()}>
                    Add
                </Button>
            </div>

            {showOptions && (
                <div className="space-y-4 p-4 bg-muted rounded-xl">
                    {/* Priority Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Priority
                        </label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setPriority(priority === 'high' ? undefined : 'high')}
                                className={`flex-1 p-2 rounded-lg border-2 transition-all ${priority === 'high'
                                    ? 'border-black bg-gray-100 dark:bg-gray-800'
                                    : 'border-border hover:bg-accent'
                                    }`}
                            >
                                <PriorityBadge priority="high" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setPriority(priority === 'medium' ? undefined : 'medium')}
                                className={`flex-1 p-2 rounded-lg border-2 transition-all ${priority === 'medium'
                                    ? 'border-gray-500 bg-gray-200 dark:bg-gray-700'
                                    : 'border-border hover:bg-accent'
                                    }`}
                            >
                                <PriorityBadge priority="medium" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setPriority(priority === 'low' ? undefined : 'low')}
                                className={`flex-1 p-2 rounded-lg border-2 transition-all ${priority === 'low'
                                    ? 'border-gray-300 bg-gray-50 dark:bg-gray-900'
                                    : 'border-border hover:bg-accent'
                                    }`}
                            >
                                <PriorityBadge priority="low" />
                            </button>
                        </div>
                    </div>

                    {/* Tags Selection */}
                    {availableTags.length > 0 && (
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Tags
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {availableTags.map(tag => (
                                    <button
                                        key={tag.id}
                                        type="button"
                                        onClick={() => toggleTag(tag.id)}
                                        className={`transition-all ${selectedTags.includes(tag.id) ? 'scale-105' : 'opacity-60 hover:opacity-100'
                                            }`}
                                    >
                                        <TagBadge tag={tag} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Due Date */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Due Date
                        </label>
                        <Input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Notes (Optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any notes about this task..."
                            className="w-full px-4 py-2.5 bg-card text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground resize-none"
                            rows={3}
                        />
                    </div>
                </div>
            )}
        </form>
    );
}