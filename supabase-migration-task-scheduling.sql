-- Migration pour ajouter les fonctionnalités de planification des tâches
-- Date: 2025-11-14

-- Ajouter les nouvelles colonnes à la table tasks
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS start_time TEXT,
ADD COLUMN IF NOT EXISTS end_time TEXT,
ADD COLUMN IF NOT EXISTS estimated_duration INTEGER;

-- Ajouter des commentaires pour documenter les colonnes
COMMENT ON COLUMN public.tasks.start_date IS 'Date de début prévue pour la tâche';
COMMENT ON COLUMN public.tasks.start_time IS 'Heure de début au format HH:mm';
COMMENT ON COLUMN public.tasks.end_time IS 'Heure de fin au format HH:mm';
COMMENT ON COLUMN public.tasks.estimated_duration IS 'Durée estimée en minutes';

-- Ajouter un index pour améliorer les performances des requêtes par date
CREATE INDEX IF NOT EXISTS idx_tasks_start_date ON public.tasks(start_date) WHERE start_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date) WHERE due_date IS NOT NULL;
