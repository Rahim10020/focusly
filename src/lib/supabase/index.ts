/**
 * @fileoverview Barrel export for Supabase modules.
 * Provides clean import paths for client and server Supabase instances.
 * 
 * @example Client usage:
 * import { supabaseClient } from '@/lib/supabase';
 * 
 * @example Server usage:
 * import { getSupabaseAdmin } from '@/lib/supabase';
 */

// Client-side exports (safe for browser)
export { supabaseClient, getSupabaseClient } from './client';

// Server-side exports (API routes only - bypasses RLS)
export { getSupabaseAdmin, supabaseServerPool } from './server';

// Type exports
export type { Database } from './database.types';
