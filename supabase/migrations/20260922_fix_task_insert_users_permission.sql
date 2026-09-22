-- Migration: Fix "permission denied for table users" on task insert
-- Cause: une policy RLS, un trigger ou une FK sur tasks/subtasks touche
-- la table public.users (legacy), qui n'a aucune policy SELECT pour le rôle
-- authenticated. L'INSERT dans tasks échoue donc avec 42501.
--
-- Correctif idempotent et safe :
-- 1. Si public.users existe + RLS activé -> ajoute policy SELECT own-row + GRANT.
-- 2. Répare les policies tasks/subtasks (auth.uid() = user_id).
-- 3. Sécurise les fonctions SECURITY DEFINER avec search_path fixe.
-- A appliquer avec: supabase db push (puis régénérer les types).

-- ============================================================================
-- 1. Diagnostic (à lancer dans Dashboard > SQL Editor pour confirmer) :
-- SELECT tablename, policyname, cmd, qual, with_check
-- FROM pg_policies WHERE tablename IN ('tasks','subtasks','users','profiles');
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
-- WHERE conrelid = 'public.tasks'::regclass;
-- SELECT trigger_name, event_object_table, action_statement
-- FROM information_schema.triggers WHERE event_object_table IN ('tasks','subtasks');
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' AND tablename='users';
-- ============================================================================

-- ============================================================================
-- 2. Si public.users existe : autoriser la lecture de sa propre ligne.
-- Sans ça, toute FK / policy / trigger qui lit public.users casse l'INSERT.
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    -- Lecture nécessaire pour les checks FK + policies qui référencent users
    GRANT SELECT ON TABLE public.users TO authenticated;
    GRANT SELECT, INSERT, UPDATE ON TABLE public.users TO service_role;

    -- RLS doit avoir au moins une policy, sinon tout est refusé (42501)
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'users'
        AND policyname = 'Users can view their own row'
    ) THEN
      CREATE POLICY "Users can view their own row"
        ON public.users FOR SELECT
        USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'users'
        AND policyname = 'Users can insert their own row'
    ) THEN
      CREATE POLICY "Users can insert their own row"
        ON public.users FOR INSERT
        WITH CHECK (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'users'
        AND policyname = 'Users can update their own row'
    ) THEN
      CREATE POLICY "Users can update their own row"
        ON public.users FOR UPDATE
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);
    END IF;
  END IF;
END $$;

-- ============================================================================
-- 3. S'assurer que tasks / subtasks ont des policies fonctionnelles.
-- (Si tes policies existent déjà avec le même nom, ce bloc ne fait rien.)
-- ============================================================================
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='tasks'
      AND policyname='Users can insert their own tasks'
  ) THEN
    CREATE POLICY "Users can insert their own tasks"
      ON public.tasks FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='tasks'
      AND policyname='Users can view their own tasks'
  ) THEN
    CREATE POLICY "Users can view their own tasks"
      ON public.tasks FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='tasks'
      AND policyname='Users can update their own tasks'
  ) THEN
    CREATE POLICY "Users can update their own tasks"
      ON public.tasks FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='tasks'
      AND policyname='Users can delete their own tasks'
  ) THEN
    CREATE POLICY "Users can delete their own tasks"
      ON public.tasks FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='subtasks'
      AND policyname='Users can view subtasks of their tasks'
  ) THEN
    CREATE POLICY "Users can view subtasks of their tasks"
      ON public.subtasks FOR SELECT
      USING (
        task_id IN (SELECT id FROM public.tasks WHERE user_id = auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='subtasks'
      AND policyname='Users can insert subtasks of their tasks'
  ) THEN
    CREATE POLICY "Users can insert subtasks of their tasks"
      ON public.subtasks FOR INSERT
      WITH CHECK (
        task_id IN (SELECT id FROM public.tasks WHERE user_id = auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='subtasks'
      AND policyname='Users can update subtasks of their tasks'
  ) THEN
    CREATE POLICY "Users can update subtasks of their tasks"
      ON public.subtasks FOR UPDATE
      USING (
        task_id IN (SELECT id FROM public.tasks WHERE user_id = auth.uid())
      )
      WITH CHECK (
        task_id IN (SELECT id FROM public.tasks WHERE user_id = auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='subtasks'
      AND policyname='Users can delete subtasks of their tasks'
  ) THEN
    CREATE POLICY "Users can delete subtasks of their tasks"
      ON public.subtasks FOR DELETE
      USING (
        task_id IN (SELECT id FROM public.tasks WHERE user_id = auth.uid())
      );
  END IF;
END $$;

-- ============================================================================
-- 4. Durcir les fonctions SECURITY DEFINER (évite qu'elles touchent
-- auth.users / public.users avec les droits de l'appelant).
-- Fix vérifié en prod web le 2026-09-22 : le trigger
-- trigger_recompute_stats_on_tasks -> trg_recompute_stats_from_tasks()
-- tournait en SECURITY INVOKER et faisait échouer l'INSERT dans tasks
-- avec "42501 permission denied for table users".
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'trg_recompute_stats_from_tasks'
      AND n.nspname = 'public'
  ) THEN
    ALTER FUNCTION public.trg_recompute_stats_from_tasks() SECURITY DEFINER;
    ALTER FUNCTION public.trg_recompute_stats_from_tasks() SET search_path = public;
  END IF;
END $$;

-- Le trigger écrit dans stats au nom de l'utilisateur : autoriser le rôle
-- authenticated (le SECURITY DEFINER ci-dessus bypass la RLS pour la
-- fonction, ce GRANT couvre les écritures directes éventuelles).
GRANT SELECT, INSERT, UPDATE ON TABLE public.stats TO authenticated;

ALTER FUNCTION public.get_tasks_with_subtasks(UUID) SET search_path = public;
ALTER FUNCTION public.complete_task_with_stats(UUID, UUID, INT) SET search_path = public;
ALTER FUNCTION public.uncomplete_task_with_stats(UUID, UUID) SET search_path = public;
ALTER FUNCTION public.delete_task_with_cleanup(UUID, UUID) SET search_path = public;
ALTER FUNCTION public.bulk_update_task_order(UUID, JSONB) SET search_path = public;
ALTER FUNCTION public.move_task_atomic(UUID, INTEGER, UUID) SET search_path = public;
