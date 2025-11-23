/**
 * @fileoverview Badge component for displaying tags with custom colors.
 */

import { Tag } from '@/types';

/**
 * Props for the TagBadge component.
 * @interface TagBadgeProps
 */
interface TagBadgeProps {
    /** The tag data to display */
    tag: Tag;
    /** Size variant of the badge */
    size?: 'sm' | 'md';
    /** Callback when remove button is clicked */
    onRemove?: () => void;
    /** Callback when badge is clicked */
    onClick?: () => void;
}

/**
 * A badge component for displaying tags with custom colors.
 * Supports optional click and remove actions.
 *
 * @param {TagBadgeProps} props - The component props
 * @param {Tag} props.tag - Tag object with name and color
 * @param {('sm'|'md')} [props.size='sm'] - Badge size
 * @param {Function} [props.onRemove] - Remove button callback
 * @param {Function} [props.onClick] - Click callback
 * @returns {JSX.Element} The rendered tag badge
 *
 * @example
 * // Basic tag
 * <TagBadge tag={{ id: '1', name: 'Work', color: '#3B82F6' }} />
 *
 * @example
 * // Removable tag
 * <TagBadge
 *   tag={tag}
 *   onRemove={() => handleRemove(tag.id)}
 * />
 *
 * @example
 * // Clickable tag
 * <TagBadge
 *   tag={tag}
 *   onClick={() => filterByTag(tag.id)}
 * />
 */
export default function TagBadge({ tag, size = 'sm', onRemove, onClick }: TagBadgeProps) {
    const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

    return (
        <span
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${sizeClasses} ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-pointer'}`}
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
                    className="hover:opacity-70 transition-opacity cursor-pointer"
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