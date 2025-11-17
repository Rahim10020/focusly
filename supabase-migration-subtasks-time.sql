-- Migration: Add hierarchical tasks support and enhanced time management
-- Date: 2025-11-17
-- Description: Adds parent_id for hierarchical tasks, time fields, and performance indexes

-- ===================================
-- 1. Add parent_id for hierarchical tasks
-- ===================================
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE;

-- Add index for parent_id queries
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON public.tasks(parent_id);

-- ===================================
-- 2. Add time management fields
-- ===================================
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS start_time TEXT, -- Format: HH:mm
ADD COLUMN IF NOT EXISTS end_time TEXT,   -- Format: HH:mm
ADD COLUMN IF NOT EXISTS estimated_duration INTEGER; -- minutes

-- ===================================
-- 3. Add progress tracking for parent tasks
-- ===================================
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);

-- ===================================
-- 4. Add reminder/notification fields
-- ===================================
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS reminder_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;

-- ===================================
-- 5. Add dependency tracking
-- ===================================
CREATE TABLE IF NOT EXISTS public.task_dependencies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    depends_on_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(task_id, depends_on_task_id),
    CHECK (task_id != depends_on_task_id) -- Prevent self-dependency
);

-- Enable RLS on task_dependencies
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;

-- Task dependencies policies
DROP POLICY IF EXISTS "Users can view their task dependencies" ON public.task_dependencies;
CREATE POLICY "Users can view their task dependencies" ON public.task_dependencies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tasks
            WHERE tasks.id = task_dependencies.task_id
            AND tasks.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create their task dependencies" ON public.task_dependencies;
CREATE POLICY "Users can create their task dependencies" ON public.task_dependencies
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tasks
            WHERE tasks.id = task_dependencies.task_id
            AND tasks.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete their task dependencies" ON public.task_dependencies;
CREATE POLICY "Users can delete their task dependencies" ON public.task_dependencies
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.tasks
            WHERE tasks.id = task_dependencies.task_id
            AND tasks.user_id = auth.uid()
        )
    );

-- ===================================
-- 6. Performance indexes
-- ===================================

-- Index for querying tasks by date range
CREATE INDEX IF NOT EXISTS idx_tasks_date_range ON public.tasks(user_id, start_date, due_date)
WHERE completed = false;

-- Index for filtering completed tasks
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON public.tasks(user_id, completed, completed_at);

-- Index for ordering tasks
CREATE INDEX IF NOT EXISTS idx_tasks_order ON public.tasks(user_id, "order");

-- Index for priority filtering
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(user_id, priority)
WHERE completed = false;

-- Index for reminder queries
CREATE INDEX IF NOT EXISTS idx_tasks_reminders ON public.tasks(reminder_time)
WHERE reminder_sent = false AND reminder_time IS NOT NULL;

-- Composite index for task list queries
CREATE INDEX IF NOT EXISTS idx_tasks_list ON public.tasks(user_id, completed, priority, due_date);

-- Index for subtasks queries
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON public.subtasks(task_id, completed);

-- ===================================
-- 7. Add order field to subtasks for drag & drop
-- ===================================
ALTER TABLE public.subtasks
ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_subtasks_order ON public.subtasks(task_id, "order");

-- ===================================
-- 8. Function to calculate task progress based on subtasks
-- ===================================
CREATE OR REPLACE FUNCTION calculate_task_progress(task_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    total_subtasks INTEGER;
    completed_subtasks INTEGER;
    progress_value INTEGER;
BEGIN
    -- Count total and completed subtasks
    SELECT COUNT(*), COUNT(*) FILTER (WHERE completed = true)
    INTO total_subtasks, completed_subtasks
    FROM public.subtasks
    WHERE task_id = task_uuid;

    -- If no subtasks, return current progress or 0
    IF total_subtasks = 0 THEN
        SELECT COALESCE(progress, 0) INTO progress_value
        FROM public.tasks
        WHERE id = task_uuid;
        RETURN progress_value;
    END IF;

    -- Calculate percentage
    progress_value := (completed_subtasks * 100) / total_subtasks;

    RETURN progress_value;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- 9. Function to get total estimated duration for a task with subtasks
-- ===================================
CREATE OR REPLACE FUNCTION calculate_total_duration(task_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    total_duration INTEGER := 0;
    task_duration INTEGER;
    subtask_duration INTEGER;
BEGIN
    -- Get the task's own estimated duration
    SELECT COALESCE(estimated_duration, 0) INTO task_duration
    FROM public.tasks
    WHERE id = task_uuid;

    -- Get sum of all child tasks' durations (recursive)
    SELECT COALESCE(SUM(calculate_total_duration(id)), 0) INTO subtask_duration
    FROM public.tasks
    WHERE parent_id = task_uuid;

    -- Return total
    total_duration := task_duration + subtask_duration;

    RETURN total_duration;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- 10. Function to check for time overlaps
-- ===================================
CREATE OR REPLACE FUNCTION check_time_overlap(
    p_user_id UUID,
    p_task_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_start_time TEXT,
    p_end_time TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    has_overlap BOOLEAN;
    task_start TIMESTAMP WITH TIME ZONE;
    task_end TIMESTAMP WITH TIME ZONE;
BEGIN
    -- If any time field is null, no overlap possible
    IF p_start_date IS NULL OR p_start_time IS NULL OR p_end_time IS NULL THEN
        RETURN false;
    END IF;

    -- Construct full timestamps
    task_start := p_start_date + p_start_time::TIME;
    task_end := p_start_date + p_end_time::TIME;

    -- Check for overlapping tasks
    SELECT EXISTS(
        SELECT 1
        FROM public.tasks
        WHERE user_id = p_user_id
        AND id != COALESCE(p_task_id, '00000000-0000-0000-0000-000000000000'::UUID)
        AND completed = false
        AND start_date IS NOT NULL
        AND start_time IS NOT NULL
        AND end_time IS NOT NULL
        AND (
            -- Overlap conditions
            (start_date + start_time::TIME, start_date + end_time::TIME) OVERLAPS (task_start, task_end)
        )
    ) INTO has_overlap;

    RETURN has_overlap;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- 11. Trigger to auto-update progress when subtasks change
-- ===================================
CREATE OR REPLACE FUNCTION update_parent_task_progress()
RETURNS TRIGGER AS $$
DECLARE
    parent_task_id UUID;
BEGIN
    -- Get the parent task ID
    IF TG_OP = 'DELETE' THEN
        parent_task_id := OLD.task_id;
    ELSE
        parent_task_id := NEW.task_id;
    END IF;

    -- Update the parent task's progress
    UPDATE public.tasks
    SET progress = calculate_task_progress(parent_task_id)
    WHERE id = parent_task_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_parent_progress ON public.subtasks;
CREATE TRIGGER trigger_update_parent_progress
AFTER INSERT OR UPDATE OR DELETE ON public.subtasks
FOR EACH ROW
EXECUTE FUNCTION update_parent_task_progress();

-- ===================================
-- 12. Comments for documentation
-- ===================================
COMMENT ON COLUMN public.tasks.parent_id IS 'Reference to parent task for hierarchical task structure';
COMMENT ON COLUMN public.tasks.start_date IS 'Date when the task is scheduled to start';
COMMENT ON COLUMN public.tasks.start_time IS 'Time when the task starts (HH:mm format)';
COMMENT ON COLUMN public.tasks.end_time IS 'Time when the task ends (HH:mm format)';
COMMENT ON COLUMN public.tasks.estimated_duration IS 'Estimated duration in minutes';
COMMENT ON COLUMN public.tasks.progress IS 'Task completion progress (0-100), auto-calculated from subtasks';
COMMENT ON COLUMN public.tasks.reminder_time IS 'When to send reminder notification';
COMMENT ON COLUMN public.tasks.reminder_sent IS 'Whether reminder has been sent';
COMMENT ON TABLE public.task_dependencies IS 'Tracks dependencies between tasks';
COMMENT ON FUNCTION calculate_task_progress(UUID) IS 'Calculates task progress based on completed subtasks';
COMMENT ON FUNCTION calculate_total_duration(UUID) IS 'Recursively calculates total duration including all subtasks';
COMMENT ON FUNCTION check_time_overlap IS 'Checks if a task time slot overlaps with existing tasks';
