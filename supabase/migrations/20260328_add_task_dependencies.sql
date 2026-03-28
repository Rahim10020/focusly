-- Migration: Add task dependencies tracking
-- Description: Allows tasks to have dependencies on other tasks
-- Created: 2026-03-28

-- ============================================================================
-- TABLE: task_dependencies
-- ============================================================================
-- Represents task dependency relationships where a task cannot be started
-- until its dependencies are completed.

CREATE TABLE IF NOT EXISTS task_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate dependencies
    UNIQUE(task_id, depends_on_task_id),
    
    -- Prevent self-referential dependencies
    CONSTRAINT no_self_dependency CHECK (task_id != depends_on_task_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_task_dependencies_task 
    ON task_dependencies(task_id);

CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on 
    ON task_dependencies(depends_on_task_id);

-- Index for finding all tasks that block a task
CREATE INDEX IF NOT EXISTS idx_task_dependencies_blocking 
    ON task_dependencies(depends_on_task_id, task_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE task_dependencies IS 'Tracks task dependency relationships';
COMMENT ON COLUMN task_dependencies.task_id IS 'The task that has the dependency';
COMMENT ON COLUMN task_dependencies.depends_on_task_id IS 'The task that must be completed first';
COMMENT ON COLUMN task_dependencies.created_at IS 'Timestamp when dependency was created';
COMMENT ON COLUMN task_dependencies.updated_at IS 'Timestamp when dependency was last updated';
