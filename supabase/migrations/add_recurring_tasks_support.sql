-- Migration pour ajouter le support des tâches récurrentes
-- et améliorer les performances

-- Ajouter les colonnes pour les tâches récurrentes
ALTER TABLE tasks 
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly', 'custom')),
  ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER DEFAULT 1 CHECK (recurrence_interval > 0),
  ADD COLUMN IF NOT EXISTS recurrence_days_of_week INTEGER[] CHECK (
    recurrence_days_of_week IS NULL OR 
    (array_length(recurrence_days_of_week, 1) IS NOT NULL AND 
     recurrence_days_of_week <@ ARRAY[0,1,2,3,4,5,6])
  ),
  ADD COLUMN IF NOT EXISTS recurrence_end_date DATE,
  ADD COLUMN IF NOT EXISTS parent_recurring_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;

-- Ajouter des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_tasks_recurring 
  ON tasks(is_recurring) 
  WHERE is_recurring = true;

CREATE INDEX IF NOT EXISTS idx_tasks_parent_recurring 
  ON tasks(parent_recurring_task_id) 
  WHERE parent_recurring_task_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_user_completed 
  ON tasks(user_id, completed);

CREATE INDEX IF NOT EXISTS idx_tasks_due_date 
  ON tasks(due_date) 
  WHERE due_date IS NOT NULL;

-- Fonction RPC pour déplacer une tâche de manière atomique
CREATE OR REPLACE FUNCTION move_task_atomic(
  p_task_id UUID,
  p_new_position INTEGER,
  p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier que l'utilisateur possède la tâche
  IF NOT EXISTS (
    SELECT 1 FROM tasks 
    WHERE id = p_task_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Task not found or access denied';
  END IF;

  -- Réordonner les tâches
  UPDATE tasks
  SET "order" = "order" + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND "order" >= p_new_position
    AND id != p_task_id;

  UPDATE tasks
  SET "order" = p_new_position,
      updated_at = NOW()
  WHERE id = p_task_id
    AND user_id = p_user_id;
END;
$$;

----------------------------------------------------------------------
-- FONCTION CORRIGÉE : get_tasks_with_subtasks
----------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_tasks_with_subtasks(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  completed BOOLEAN,
  created_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  pomodoro_count INTEGER,
  priority TEXT,
  tags TEXT[],
  due_date TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  start_time TEXT,
  end_time TEXT,
  estimated_duration INTEGER,
  notes TEXT,
  "order" INTEGER,
  sub_domain TEXT,
  version INTEGER,
  is_recurring BOOLEAN,
  recurrence_pattern TEXT,
  recurrence_interval INTEGER,
  recurrence_days_of_week INTEGER[],
  recurrence_end_date DATE,
  parent_recurring_task_id UUID,
  updated_at TIMESTAMPTZ,
  subtasks JSONB
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    t.id,
    t.user_id,
    t.title,
    t.completed,
    t.created_at,
    t.completed_at,
    t.failed_at,
    t.pomodoro_count,
    t.priority,
    t.tags,
    t.due_date,
    t.start_date,
    t.start_time,
    t.end_time,
    t.estimated_duration,
    t.notes,
    t."order",
    t.sub_domain,
    t.version,
    t.is_recurring,
    t.recurrence_pattern,
    t.recurrence_interval,
    t.recurrence_days_of_week,
    t.recurrence_end_date,
    t.parent_recurring_task_id,
    t.updated_at,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', s.id,
          'title', s.title,
          'completed', s.completed,
          'created_at', s.created_at,
          'completed_at', s.completed_at,
          'order', t."order"
        ) ORDER BY t."order"
      ) FILTER (WHERE s.id IS NOT NULL),
      '[]'::jsonb
    ) AS subtasks
  FROM tasks t
  LEFT JOIN subtasks s ON s.task_id = t.id
  WHERE t.user_id = p_user_id
  GROUP BY t.id
  ORDER BY t."order";
$$;

-- Commentaires
COMMENT ON COLUMN tasks.is_recurring IS 'Indique si la tâche se répète automatiquement';
COMMENT ON COLUMN tasks.recurrence_pattern IS 'Modèle de récurrence: daily, weekly, monthly, ou custom';
COMMENT ON COLUMN tasks.recurrence_interval IS 'Intervalle de récurrence (ex: tous les 2 jours)';
COMMENT ON COLUMN tasks.recurrence_days_of_week IS 'Jours de la semaine pour la récurrence custom (0=Dimanche, 6=Samedi)';
COMMENT ON COLUMN tasks.recurrence_end_date IS 'Date de fin de la récurrence (optionnel)';
COMMENT ON COLUMN tasks.parent_recurring_task_id IS 'ID de la tâche récurrente parente';

COMMENT ON FUNCTION move_task_atomic IS 'Déplace une tâche de manière atomique pour éviter les conflits de concurrence';
COMMENT ON FUNCTION get_tasks_with_subtasks IS 'Récupère toutes les tâches avec leurs sous-tâches en une seule requête optimisée';
