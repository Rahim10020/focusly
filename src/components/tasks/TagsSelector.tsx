/**
 * @fileoverview TagsSelector component for choosing task tags.
 */

import { Tag } from '@/types';

interface TagsSelectorProps {
    tags: Tag[];
    selectedTags: string[];
    onToggle: (tagId: string) => void;
}

export default function TagsSelector({
    tags,
    selectedTags,
    onToggle,
}: TagsSelectorProps) {
    if (tags.length === 0) return null;

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                    <button
                        key={tag.id}
                        type="button"
                        onClick={() => onToggle(tag.id)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all cursor-pointer ${
                            selectedTags.includes(tag.id)
                                ? 'bg-primary text-primary-foreground scale-105'
                                : 'bg-muted hover:bg-accent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {tag.name}
                    </button>
                ))}
            </div>
        </div>
    );
}
