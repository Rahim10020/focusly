-- Add new columns to tasks table
ALTER TABLE tasks 
  ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS postponed_to TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_overdue boolean DEFAULT false;

-- Populate initial is_overdue values
UPDATE tasks
SET is_overdue = (completed = false AND due_date IS NOT NULL AND due_date < NOW())
WHERE completed IS NOT NULL; -- optional filter

-- Add index for failed tasks queries
CREATE INDEX IF NOT EXISTS idx_tasks_failed_at ON tasks(failed_at) WHERE failed_at IS NOT NULL;

-- Add index for postponed tasks queries
CREATE INDEX IF NOT EXISTS idx_tasks_postponed_to ON tasks(postponed_to) WHERE postponed_to IS NOT NULL;

-- Index on is_overdue for fast overdue queries
CREATE INDEX IF NOT EXISTS idx_tasks_is_overdue ON tasks(is_overdue) WHERE is_overdue = true;

-- Trigger to maintain is_overdue on INSERT/UPDATE
CREATE OR REPLACE FUNCTION tasks_set_is_overdue()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.is_overdue := (NEW.completed = false AND NEW.due_date IS NOT NULL AND NEW.due_date < NOW());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tasks_set_is_overdue ON tasks;
CREATE TRIGGER trg_tasks_set_is_overdue
  BEFORE INSERT OR UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION tasks_set_is_overdue();

-- Comment the new columns
COMMENT ON COLUMN tasks.failed_at IS 'Timestamp when the task was marked as failed';
COMMENT ON COLUMN tasks.postponed_to IS 'New due date when a task is postponed';
COMMENT ON COLUMN tasks.is_overdue IS 'Boolean flag indicating if task is overdue (denormalized for indexing)';