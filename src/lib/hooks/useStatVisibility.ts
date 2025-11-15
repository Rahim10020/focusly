import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSession } from 'next-auth/react';

export interface StatVisibility {
    stat_field: string;
    visible_to_friends: boolean;
}

export function useStatVisibility() {
    const { data: session } = useSession();
    const [visibilitySettings, setVisibilitySettings] = useState<StatVisibility[]>([]);
    const [loading, setLoading] = useState(true);

    const statFields = [
        'total_sessions',
        'completed_tasks',
        'total_tasks',
        'streak',
        'total_focus_time',
        'longest_streak',
        'tasks_completed_today'
    ];

    useEffect(() => {
        if (session?.user?.id) {
            fetchVisibilitySettings();
        }
    }, [session]);

    const fetchVisibilitySettings = async () => {
        try {
            const { data, error } = await supabase
                .from('stat_visibility')
                .select('stat_field, visible_to_friends')
                .eq('user_id', session?.user?.id);

            if (error) throw error;

            // Create default settings for missing fields
            const existingSettings = new Map(data?.map((s: any) => [s.stat_field, s.visible_to_friends as boolean]) || []);
            const allSettings = statFields.map(field => ({
                stat_field: field,
                visible_to_friends: (existingSettings.get(field) ?? true) as boolean
            }));

            setVisibilitySettings(allSettings);
        } catch (error) {
            console.error('Error fetching stat visibility:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateVisibility = async (statField: string, visible: boolean) => {
        try {
            const { error } = await supabase
                .from('stat_visibility')
                .upsert({
                    user_id: session?.user?.id,
                    stat_field: statField,
                    visible_to_friends: visible
                });

            if (error) throw error;

            setVisibilitySettings(prev =>
                prev.map(setting =>
                    setting.stat_field === statField
                        ? { ...setting, visible_to_friends: visible }
                        : setting
                )
            );
        } catch (error) {
            console.error('Error updating stat visibility:', error);
        }
    };

    return {
        visibilitySettings,
        loading,
        updateVisibility
    };
}