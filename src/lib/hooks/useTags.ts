/**
 * @fileoverview Tag management hook for task categorization.
 * Provides CRUD operations for tags with custom colors,
 * supporting both localStorage and Supabase persistence.
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useLocalStorage } from './useLocalStorage';
import { Tag } from '@/types';
import { supabase } from '@/lib/supabase';

/**
 * Default tags provided for new users.
 * @constant
 */
const DEFAULT_TAGS: Tag[] = [
    { id: 'work', name: 'Work', color: '#3B82F6', createdAt: Date.now() },
    { id: 'personal', name: 'Personal', color: '#10B981', createdAt: Date.now() },
    { id: 'urgent', name: 'Urgent', color: '#EF4444', createdAt: Date.now() },
    { id: 'study', name: 'Study', color: '#8B5CF6', createdAt: Date.now() },
];

/**
 * Hook for managing task tags with custom names and colors.
 * Provides CRUD operations with localStorage or Supabase persistence.
 *
 * @returns {Object} Tag state and management functions
 * @returns {Tag[]} returns.tags - Array of all tags
 * @returns {Function} returns.addTag - Create a new tag
 * @returns {Function} returns.updateTag - Update an existing tag
 * @returns {Function} returns.deleteTag - Delete a tag
 * @returns {Function} returns.getTagById - Get a single tag by ID
 * @returns {Function} returns.getTagsByIds - Get multiple tags by IDs
 *
 * @example
 * const { tags, addTag, updateTag, deleteTag, getTagById } = useTags();
 *
 * // Add a new tag
 * const newTag = await addTag('Project X', '#FF5722');
 *
 * // Update tag color
 * await updateTag('tag-123', { color: '#4CAF50' });
 *
 * // Get tags for display
 * const taskTags = getTagsByIds(['work', 'urgent']);
 */
export function useTags() {
    const { data: session } = useSession();
    const [localTags, setLocalTags] = useLocalStorage<Tag[]>('focusly_tags', DEFAULT_TAGS);
    const [dbTags, setDbTags] = useState<Tag[]>(DEFAULT_TAGS);

    const getUserId = () => session?.user?.id;

    // Set Supabase auth session when user logs in
    useEffect(() => {
        if (session?.accessToken && session?.refreshToken) {
            supabase.auth.setSession({
                access_token: session.accessToken,
                refresh_token: session.refreshToken,
            });
        }
    }, [session]);

    // Load tags from database when user logs in
    useEffect(() => {
        const userId = getUserId();
        if (userId) {
            loadTagsFromDB();
        } else {
            setDbTags(DEFAULT_TAGS);
        }
    }, [session?.user?.id]);

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

            const formattedTags: Tag[] = data.map((dbTag: any) => ({
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
                const { data, error } = await (supabase
                    .from('tags') as any)
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
                const { error } = await (supabase
                    .from('tags') as any)
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
                const { error } = await (supabase
                    .from('tags') as any)
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