import { Tag } from '@/types';

interface TagBadgeProps {
    tag: Tag;
    size?: 'sm' | 'md';
    onRemove?: () => void;
}

export default function TagBadge({ tag, size = 'sm', onRemove }: TagBadgeProps) {
    const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${sizeClasses}`}
            style={{
                backgroundColor: `${tag.color}15`,
                borderColor: `${tag.color}40`,
                color: tag.color,
            }}
        >
            {tag.name}
            {onRemove && (
                <button
                    onClick={onRemove}
                    className="hover:opacity-70 transition-opacity"
                    aria-label="Remove tag"
                >
                    <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            )}
        </span>
    );
}