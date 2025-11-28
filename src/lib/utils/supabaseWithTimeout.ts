import { SupabaseClient } from '@supabase/supabase-js';

export async function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number = 10000,
    errorMessage: string = 'Request timeout'
): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
        )
    ]);
}