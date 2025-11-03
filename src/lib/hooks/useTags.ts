import { useLocalStorage } from './useLocalStorage';
import { Tag } from '@/types';

const DEFAULT_TAGS: Tag[] = [
    { id: 'work', name: 'Work', color: '#3B82F6', createdAt: Date.now() },
    { id: 'personal', name: 'Personal', color: '#10B981', createdAt: Date.now() },
    { id: 'urgent', name: 'Urgent', color: '#EF4444', createdAt: Date.now() },
    { id: 'study', name: 'Study', color: '#8B5CF6', createdAt: Date.now() },
];

export function useTags() {
    const [tags, setTags] = useLocalStorage<Tag[]>('focusly_tags', DEFAULT_TAGS);

    const addTag = (name: string, color: string) => {
        const newTag: Tag = {
            id: `tag-${Date.now()}`,
            name,
            color,
            createdAt: Date.now(),
        };
        setTags([...tags, newTag]);
        return newTag;
    };

    const updateTag = (id: string, updates: Partial<Omit<Tag, 'id' | 'createdAt'>>) => {
        setTags(tags.map(tag => (tag.id === id ? { ...tag, ...updates } : tag)));
    };

    const deleteTag = (id: string) => {
        setTags(tags.filter(tag => tag.id !== id));
    };

    const getTagById = (id: string) => {
        return tags.find(tag => tag.id === id);
    };

    const getTagsByIds = (ids: string[]) => {
        return tags.filter(tag => ids.includes(tag.id));
    };

    return {
        tags,
        addTag,
        updateTag,
        deleteTag,
        getTagById,
        getTagsByIds,
    };
}