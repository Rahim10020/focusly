'use client';

import { useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Tag, Priority } from '@/types';
import TagBadge from '@/components/ui/TagBadge';
import PriorityBadge from '@/components/ui/PriorityBadge';

interface TaskFormProps {
    onAddTask: (title: string, priority?: Priority, tags?: string[]) => void;
    availableTags: Tag[];
}

export default function TaskForm({ onAddTask, availableTags }: TaskFormProps) {
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState<Priority | undefined>(undefined);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [showOptions, setShowOptions] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            onAddTask(title.trim(), priority, selectedTags.length > 0 ? selectedTags : undefined);
            setTitle('');
            setPriority(undefined);
            setSelectedTags([]);
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
                <div className="space-y-3 p-4 bg-muted rounded-xl">
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
                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                    : 'border-border hover:bg-accent'
                                    }`}
                            >
                                <PriorityBadge priority="high" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setPriority(priority === 'medium' ? undefined : 'medium')}
                                className={`flex-1 p-2 rounded-lg border-2 transition-all ${priority === 'medium'
                                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                                    : 'border-border hover:bg-accent'
                                    }`}
                            >
                                <PriorityBadge priority="medium" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setPriority(priority === 'low' ? undefined : 'low')}
                                className={`flex-1 p-2 rounded-lg border-2 transition-all ${priority === 'low'
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
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
                </div>
            )}
        </form>
    );
}