/**
 * @fileoverview Examples of using custom hook utilities and patterns.
 * This file demonstrates best practices for creating and enhancing hooks.
 * 
 * @module examples/hookExamples
 */

import { useState, useCallback } from 'react';
import {
    withErrorHandling,
    useDataFetching,
    performOptimisticUpdate,
    createDebouncedFunction,
    HookResult
} from '@/lib/utils/hookHelpers';
import { supabaseClient } from '@/lib/supabase/client';
import { retryWithBackoff } from '@/lib/utils/retry';

// ============================================================================
// Example 1: Simple Data Fetching Hook with Error Handling
// ============================================================================

/**
 * Example: Basic data fetching hook using the standard pattern
 */
export function useUserProfile(userId: string): HookResult<any> {
    return useDataFetching(
        async () => {
            const { data, error } = await supabaseClient
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return data;
        },
        [userId]
    );
}

// Usage:
// const { data: profile, loading, error, refetch } = useUserProfile('user-123');

// ============================================================================
// Example 2: Enhanced Hook with Error Handling Wrapper
// ============================================================================

/**
 * Example: Hook with custom error handling
 */
function useProjectsBase(workspaceId: string) {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadProjects = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await retryWithBackoff(async () => {
                const result = await supabaseClient
                    .from('projects')
                    .select('*')
                    .eq('workspace_id', workspaceId);
                if (result.error) throw result.error;
                return result;
            });

            if (error) throw error;
            setProjects(data);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, [workspaceId]);

    return {
        data: projects,
        loading,
        error,
        refetch: loadProjects
    };
}

// Wrap with error handling
export const useProjects = withErrorHandling(useProjectsBase, {
    showToast: true,
    autoRetry: true,
    maxRetries: 3,
    transformError: (err) => {
        if (err.message.includes('permission')) {
            return 'You do not have permission to view these projects';
        }
        return err.message;
    },
    onError: (err) => {
        console.error('Projects error:', err);
        // Could send to error tracking service here
    }
});

// Usage:
// const { data, loading, error } = useProjects('workspace-456');

// ============================================================================
// Example 3: Hook with Optimistic Updates and Version Locking
// ============================================================================

/**
 * Example: Document editing with optimistic locking
 */
export function useDocument(documentId: string) {
    const [document, setDocument] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadDocument = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabaseClient
                .from('documents')
                .select('*')
                .eq('id', documentId)
                .single();

            if (error) throw error;
            setDocument(data);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, [documentId]);

    const updateDocument = async (updates: Partial<any>) => {
        if (!document) return;

        // Optimistic update with version locking
        await performOptimisticUpdate(
            updates,
            {
                version: document.version,
                getCurrentData: () => document,
                applyUpdate: (doc, updates) => {
                    // Apply optimistic update locally first
                    const updated = { ...doc, ...updates };
                    setDocument(updated);
                    return updated;
                },
                executeUpdate: async (doc, updates, version) => {
                    const { data, error } = await (supabaseClient
                        .from('documents') as any)
                        .update({
                            ...updates,
                            version: version + 1,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', doc.id)
                        .eq('version', version)
                        .select('version')
                        .single();

                    return { version: data?.version, error };
                },
                onConflict: async () => {
                    // Reload document if conflict detected
                    await loadDocument();
                    throw new Error('Document was modified by someone else. Changes reloaded.');
                }
            }
        );
    };

    return {
        document,
        loading,
        error,
        updateDocument,
        refetch: loadDocument
    };
}

// Usage:
// const { document, updateDocument } = useDocument('doc-789');
// await updateDocument({ title: 'New Title' }); // Optimistic with conflict detection

// ============================================================================
// Example 4: Debounced Search Hook
// ============================================================================

/**
 * Example: Search with debounced API calls
 */
export function useSearch(query: string, delay: number = 500) {
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Create debounced search function
    const debouncedSearch = useCallback(
        createDebouncedFunction(
            async (searchQuery: string) => {
                if (!searchQuery.trim()) {
                    setResults([]);
                    return;
                }

                try {
                    setLoading(true);
                    setError(null);

                    const { data, error } = await supabaseClient
                        .from('items')
                        .select('*')
                        .ilike('title', `%${searchQuery}%`)
                        .limit(20);

                    if (error) throw error;
                    setResults(data || []);
                } catch (err) {
                    setError((err as Error).message);
                } finally {
                    setLoading(false);
                }
            },
            delay
        ),
        [delay]
    );

    // Trigger search when query changes
    useCallback(() => {
        debouncedSearch(query);
    }, [query, debouncedSearch]);

    return {
        results,
        loading,
        error,
        clearResults: () => setResults([])
    };
}

// Usage:
// const { results, loading } = useSearch(searchTerm);

// ============================================================================
// Example 5: Complex Hook with Multiple Operations
// ============================================================================

/**
 * Example: Shopping cart with multiple operations
 */
export function useShoppingCart(userId: string) {
    const [cart, setCart] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadCart = useCallback(async () => {
        try {
            setLoading(true);

            // Load cart and items in parallel
            const [cartResult, itemsResult] = await Promise.all([
                supabaseClient
                    .from('carts')
                    .select('*')
                    .eq('user_id', userId)
                    .single(),
                supabaseClient
                    .from('cart_items')
                    .select('*, products(*)')
                    .eq('user_id', userId)
            ]);

            if (cartResult.error) throw cartResult.error;
            if (itemsResult.error) throw itemsResult.error;

            setCart(cartResult.data);
            setItems(itemsResult.data || []);
        } catch (err) {
            console.error('Error loading cart:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const addItem = async (productId: string, quantity: number) => {
        try {
            // Optimistic update
            const optimisticItem = {
                id: `temp-${Date.now()}`,
                product_id: productId,
                quantity,
                user_id: userId
            };
            setItems(prev => [...prev, optimisticItem]);

            const { data, error } = await retryWithBackoff(async () => {
                const result = await (supabaseClient
                    .from('cart_items') as any)
                    .insert({ product_id: productId, quantity, user_id: userId })
                    .select('*, products(*)')
                    .single();
                if (result.error) throw result.error;
                return result;
            });

            if (error) throw error;

            // Replace optimistic item with real data
            setItems(prev =>
                prev.map(item =>
                    item.id === optimisticItem.id ? data : item
                )
            );
        } catch (err) {
            // Rollback on error
            setItems(prev =>
                prev.filter(item => !item.id.startsWith('temp-'))
            );
            throw err;
        }
    };

    const removeItem = async (itemId: string) => {
        // Optimistic removal
        const removedItem = items.find(i => i.id === itemId);
        setItems(prev => prev.filter(i => i.id !== itemId));

        try {
            const { error } = await supabaseClient
                .from('cart_items')
                .delete()
                .eq('id', itemId);

            if (error) throw error;
        } catch (err) {
            // Rollback on error
            if (removedItem) {
                setItems(prev => [...prev, removedItem]);
            }
            throw err;
        }
    };

    const updateQuantity = async (itemId: string, quantity: number) => {
        const oldItem = items.find(i => i.id === itemId);

        // Optimistic update
        setItems(prev =>
            prev.map(item =>
                item.id === itemId ? { ...item, quantity } : item
            )
        );

        try {
            const { error } = await (supabaseClient
                .from('cart_items') as any)
                .update({ quantity })
                .eq('id', itemId);

            if (error) throw error;
        } catch (err) {
            // Rollback on error
            if (oldItem) {
                setItems(prev =>
                    prev.map(item =>
                        item.id === itemId ? oldItem : item
                    )
                );
            }
            throw err;
        }
    };

    return {
        cart,
        items,
        loading,
        addItem,
        removeItem,
        updateQuantity,
        refetch: loadCart,
        totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: items.reduce((sum, item) =>
            sum + (item.products?.price || 0) * item.quantity, 0
        )
    };
}

// Usage:
// const { items, addItem, removeItem, totalPrice } = useShoppingCart('user-123');

// ============================================================================
// Example 6: Real-time Subscription Hook
// ============================================================================

/**
 * Example: Real-time data with Supabase subscriptions
 */
export function useRealtimeMessages(channelId: string) {
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useCallback(() => {
        const loadMessages = async () => {
            const { data, error } = await supabaseClient
                .from('messages')
                .select('*')
                .eq('channel_id', channelId)
                .order('created_at', { ascending: true });

            if (!error && data) {
                setMessages(data);
            }
            setLoading(false);
        };

        loadMessages();

        // Subscribe to new messages
        const subscription = supabaseClient
            .channel(`messages:${channelId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `channel_id=eq.${channelId}`
            }, (payload) => {
                setMessages(prev => [...prev, payload.new]);
            })
            .on('postgres_changes', {
                event: 'DELETE',
                schema: 'public',
                table: 'messages',
                filter: `channel_id=eq.${channelId}`
            }, (payload) => {
                setMessages(prev => prev.filter(m => m.id !== payload.old.id));
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [channelId]);

    const sendMessage = async (content: string) => {
        const { error } = await (supabaseClient
            .from('messages') as any)
            .insert({ channel_id: channelId, content });

        if (error) throw error;
    };

    return {
        messages,
        loading,
        sendMessage
    };
}

// Usage:
// const { messages, sendMessage } = useRealtimeMessages('channel-123');

// ============================================================================
// Best Practices Summary
// ============================================================================

/**
 * 1. Always use retryWithBackoff for database operations
 * 2. Always implement optimistic updates for better UX
 * 3. Always handle rollback on errors
 * 4. Always debounce user input
 * 5. Always use version locking for concurrent updates
 * 6. Always provide refetch capability
 * 7. Always handle loading and error states
 * 8. Always clean up subscriptions and timers
 * 9. Always log errors with context
 * 10. Always use TypeScript for type safety
 */
