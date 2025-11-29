-- Migration: Add failed_at field to tasks table for tracking failed/overdue tasks
-- This allows the system to automatically mark tasks as failed when they are overdue

-- Add failed_at column to tasks table
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS failed_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient querying of failed tasks
CREATE INDEX IF NOT EXISTS idx_tasks_failed_at ON public.tasks(failed_at);

-- Create index for efficient querying of overdue tasks
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date) WHERE completed = FALSE AND failed_at IS NULL;

-- Function to mark overdue tasks as failed
CREATE OR REPLACE FUNCTION mark_overdue_tasks_as_failed()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Mark tasks as failed if:
    -- 1. They have a due_date
    -- 2. The due_date has passed
    -- 3. They are not completed
    -- 4. They are not already marked as failed
    UPDATE public.tasks
    SET failed_at = NOW()
    WHERE due_date < NOW()
      AND completed = FALSE
      AND failed_at IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a cron job to run every hour to mark overdue tasks
-- Note: This requires pg_cron extension to be enabled in Supabase
-- You can enable it via: CREATE EXTENSION IF NOT EXISTS pg_cron;
-- Or run the function manually via an API route

COMMENT ON COLUMN public.tasks.failed_at IS 'Timestamp when the task was marked as failed (overdue and not completed)';
COMMENT ON FUNCTION mark_overdue_tasks_as_failed() IS 'Marks all overdue tasks as failed. Returns the number of tasks updated.';
