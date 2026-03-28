-- Migration: Enable RLS on task dependency table and add ownership policies
-- Description: Fixes Supabase Security Advisor warning for table exposed via PostgREST
-- Created: 2026-03-28

-- NOTE:
-- Some environments may have a typo in table name (`task_dependecies`).
-- This migration applies the same security rules to both names when present.

DO $$
DECLARE
    dep_table TEXT;
BEGIN
    FOREACH dep_table IN ARRAY ARRAY['task_dependencies', 'task_dependecies']
    LOOP
        IF EXISTS (
            SELECT 1
            FROM pg_tables
            WHERE schemaname = 'public'
              AND tablename = dep_table
        ) THEN
            -- Enable Row Level Security
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', dep_table);

            -- Remove old policies if they exist
            EXECUTE format('DROP POLICY IF EXISTS "dep_select_own" ON public.%I', dep_table);
            EXECUTE format('DROP POLICY IF EXISTS "dep_insert_own" ON public.%I', dep_table);
            EXECUTE format('DROP POLICY IF EXISTS "dep_update_own" ON public.%I', dep_table);
            EXECUTE format('DROP POLICY IF EXISTS "dep_delete_own" ON public.%I', dep_table);

            -- SELECT: user can read only dependencies linked to their own tasks
            EXECUTE format($sql$
                CREATE POLICY "dep_select_own"
                ON public.%I
                FOR SELECT
                USING (
                    EXISTS (
                        SELECT 1
                        FROM public.tasks t
                        WHERE t.id = task_id
                          AND t.user_id = auth.uid()
                    )
                    AND EXISTS (
                        SELECT 1
                        FROM public.tasks t2
                        WHERE t2.id = depends_on_task_id
                          AND t2.user_id = auth.uid()
                    )
                )
            $sql$, dep_table);

            -- INSERT: user can create dependencies only between their own tasks
            EXECUTE format($sql$
                CREATE POLICY "dep_insert_own"
                ON public.%I
                FOR INSERT
                WITH CHECK (
                    EXISTS (
                        SELECT 1
                        FROM public.tasks t
                        WHERE t.id = task_id
                          AND t.user_id = auth.uid()
                    )
                    AND EXISTS (
                        SELECT 1
                        FROM public.tasks t2
                        WHERE t2.id = depends_on_task_id
                          AND t2.user_id = auth.uid()
                    )
                )
            $sql$, dep_table);

            -- UPDATE: user can update only their own dependencies
            EXECUTE format($sql$
                CREATE POLICY "dep_update_own"
                ON public.%I
                FOR UPDATE
                USING (
                    EXISTS (
                        SELECT 1
                        FROM public.tasks t
                        WHERE t.id = task_id
                          AND t.user_id = auth.uid()
                    )
                    AND EXISTS (
                        SELECT 1
                        FROM public.tasks t2
                        WHERE t2.id = depends_on_task_id
                          AND t2.user_id = auth.uid()
                    )
                )
                WITH CHECK (
                    EXISTS (
                        SELECT 1
                        FROM public.tasks t
                        WHERE t.id = task_id
                          AND t.user_id = auth.uid()
                    )
                    AND EXISTS (
                        SELECT 1
                        FROM public.tasks t2
                        WHERE t2.id = depends_on_task_id
                          AND t2.user_id = auth.uid()
                    )
                )
            $sql$, dep_table);

            -- DELETE: user can delete only their own dependencies
            EXECUTE format($sql$
                CREATE POLICY "dep_delete_own"
                ON public.%I
                FOR DELETE
                USING (
                    EXISTS (
                        SELECT 1
                        FROM public.tasks t
                        WHERE t.id = task_id
                          AND t.user_id = auth.uid()
                    )
                    AND EXISTS (
                        SELECT 1
                        FROM public.tasks t2
                        WHERE t2.id = depends_on_task_id
                          AND t2.user_id = auth.uid()
                    )
                )
            $sql$, dep_table);
        END IF;
    END LOOP;
END $$;
