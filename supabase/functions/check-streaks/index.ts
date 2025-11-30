// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: any;

/**
 * Supabase Edge Function to check and reset user streaks daily
 * This function should be scheduled to run daily using Supabase Cron
 * Schedule: 0 0 * * * (midnight every day)
 */

serve(async (req: Request) => {
    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Récupérer tous les utilisateurs avec un streak actif
        const { data: users, error: usersError } = await supabase
            .from('stats')
            .select('user_id, streak, last_active_date')
            .gt('streak', 0);

        if (usersError) {
            throw usersError;
        }

        const updates = [];
        const notifications = [];
        const now = new Date();

        for (const user of users || []) {
            if (!user.last_active_date) continue;

            const lastActive = new Date(user.last_active_date);

            // Calculer la différence en jours
            const daysDiff = Math.floor(
                (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
            );

            // Si plus d'un jour d'inactivité, réinitialiser le streak
            if (daysDiff > 1) {
                updates.push({
                    user_id: user.user_id,
                    streak: 0,
                    updated_at: now.toISOString()
                });

                // Créer une notification pour l'utilisateur
                notifications.push({
                    user_id: user.user_id,
                    type: 'streak_lost',
                    title: 'Streak perdu',
                    message: `Votre streak de ${user.streak} jour${user.streak > 1 ? 's' : ''} a été réinitialisé. Commencez-en un nouveau aujourd'hui!`,
                    read: false,
                    created_at: now.toISOString()
                });
            }
        }

        // Mettre à jour les stats si nécessaire
        if (updates.length > 0) {
            const { error: updateError } = await supabase
                .from('stats')
                .upsert(updates, { onConflict: 'user_id' });

            if (updateError) {
                throw updateError;
            }
        }

        // Créer les notifications
        if (notifications.length > 0) {
            const { error: notifError } = await supabase
                .from('notifications')
                .insert(notifications);

            if (notifError) {
                console.error('Error creating notifications:', notifError);
                // Ne pas throw ici, les notifications ne sont pas critiques
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Streak check completed',
                stats: {
                    usersChecked: users?.length || 0,
                    streaksReset: updates.length,
                    notificationsSent: notifications.length
                }
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('Error in check-streaks function:', error);

        let errorMessage = 'An unknown error occurred';
        if (error instanceof Error) {
            errorMessage = error.message;
        } else {
            errorMessage = String(error);
        }

        return new Response(
            JSON.stringify({
                success: false,
                error: errorMessage
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
});
