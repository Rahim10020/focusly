import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    try {
        const { theme } = await request.json();

        if (theme !== 'light' && theme !== 'dark') {
            return new NextResponse(
                JSON.stringify({ error: 'Invalid theme value. Must be "light" or "dark".' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // Mettre à jour ou insérer la préférence de thème
        const { error } = await supabase
            .from('user_preferences')
            .upsert(
                {
                    user_id: session.user.id,
                    theme_preference: theme,
                    updated_at: new Date().toISOString()
                },
                { onConflict: 'user_id' }
            );

        if (error) {
            console.error('Error updating theme preference:', error);
            throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in preferences API:', error);
        return new NextResponse(
            JSON.stringify({ error: 'Failed to update preferences' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
