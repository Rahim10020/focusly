import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useLocalStorage } from './useLocalStorage';
import { Tag } from '@/types';
import { supabase } from '@/lib/supabase';

const DEFAULT_TAGS: Tag[] = [
    { id: 'work', name: 'Work', color: '#3B82F6', createdAt: Date.now() },
    { id: 'personal', name: 'Personal', color: '#10B981', createdAt: Date.now() },
    { id: 'urgent', name: 'Urgent', color: '#EF4444', createdAt: Date.now() },
    { id: 'study', name: 'Study', color: '#8B5CF6', createdAt: Date.now() },
];

export function useTags() {
    const { data: session } = useSession();
    const [localTags, setLocalTags] = useLocalStorage<Tag[]>('focusly_tags', DEFAULT_TAGS);
    const [dbTags, setDbTags] = useState<Tag[]>(DEFAULT_TAGS);

    const getUserId = () => (session?.user as any)?.id;

    // Load tags from database when user logs in
    useEffect(() => {
        if (getUserId()) {
            loadTagsFromDB();
        } else {
            setDbTags(DEFAULT_TAGS);
        }
    }, [getUserId()]);

    const loadTagsFromDB = async () => {
        const userId = getUserId();
        if (!userId) return;

        try {
            const { data, error } = await supabase
                .from('tags')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            const formattedTags: Tag[] = data.map(dbTag => ({
                id: dbTag.id,
                name: dbTag.name,
                color: dbTag.color,
                createdAt: new Date(dbTag.created_at).getTime(),
            }));

            // Merge with default tags if no custom tags
            setDbTags(formattedTags.length > 0 ? formattedTags : DEFAULT_TAGS);
        } catch (error) {
            console.error('Error loading tags from DB:', error);
            setDbTags(DEFAULT_TAGS);
        }
    };

    const currentTags = getUserId() ? dbTags : localTags;
    const setCurrentTags = getUserId() ? setDbTags : setLocalTags;

    const addTag = async (name: string, color: string) => {
        const newTag: Tag = {
            id: `tag-${Date.now()}`,
            name,
            color,
            createdAt: Date.now(),
        };

        const userId = getUserId();
        if (userId) {
            // Save to database
            try {
                const { data, error } = await supabase
                    .from('tags')
                    .insert({
                        id: newTag.id,
                        user_id: userId,
                        name: newTag.name,
                        color: newTag.color,
                        created_at: new Date(newTag.createdAt).toISOString(),
                    })
                    .select()
                    .single();

                if (error) throw error;

                setCurrentTags([...currentTags, newTag]);
            } catch (error) {
                console.error('Error adding tag to DB:', error);
            }
        } else {
            // Save to localStorage
            setCurrentTags([...currentTags, newTag]);
        }

        return newTag;
    };

    const updateTag = async (id: string, updates: Partial<Omit<Tag, 'id' | 'createdAt'>>) => {
        const userId = getUserId();
        if (userId) {
            // Update in database
            try {
                const { error } = await supabase
                    .from('tags')
                    .update({
                        name: updates.name,
                        color: updates.color,
                    })
                    .eq('id', id)
                    .eq('user_id', userId);

                if (error) throw error;

                setCurrentTags(currentTags.map((tag: Tag) => (tag.id === id ? { ...tag, ...updates } : tag)));
            } catch (error) {
                console.error('Error updating tag in DB:', error);
            }
        } else {
            // Update in localStorage
            setCurrentTags(currentTags.map((tag: Tag) => (tag.id === id ? { ...tag, ...updates } : tag)));
        }
    };

    const deleteTag = async (id: string) => {
        const userId = getUserId();
        if (userId) {
            // Delete from database
            try {
                const { error } = await supabase
                    .from('tags')
                    .delete()
                    .eq('id', id)
                    .eq('user_id', userId);

                if (error) throw error;

                setCurrentTags(currentTags.filter((tag: Tag) => tag.id !== id));
            } catch (error) {
                console.error('Error deleting tag from DB:', error);
            }
        } else {
            // Delete from localStorage
            setCurrentTags(currentTags.filter((tag: Tag) => tag.id !== id));
        }
    };

    const getTagById = (id: string) => {
        return currentTags.find((tag: Tag) => tag.id === id);
    };

    const getTagsByIds = (ids: string[]) => {
        return currentTags.filter((tag: Tag) => ids.includes(tag.id));
    };

    return {
        tags: currentTags,
        addTag,
        updateTag,
        deleteTag,
        getTagById,
        getTagsByIds,
    };
}