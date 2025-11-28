-- Migration: Add transaction support for task completion
-- Description: Creates stored procedure for atomic task completion with stats update
-- Created: 2024-11-28

-- ============================================================================
-- FUNCTION: complete_task_with_stats
-- ============================================================================

/**
 * Atomically complete a task and update user statistics.
 * This ensures data consistency when marking a task as complete.
 * 
 * @param p_task_id UUID - The task ID to complete
 * @param p_user_id UUID - The user ID (for security check)
 * @param p_pomodoro_count INT - Number of pomodoros completed for this task
 * @returns JSON with success status and updated task data
 */
CREATE OR REPLACE FUNCTION complete_task_with_stats(
    p_task_id UUID,
    p_user_id UUID,
    p_pomodoro_count INT DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
    v_task_exists BOOLEAN;
    v_already_completed BOOLEAN;
BEGIN
    -- Check if task exists and belongs to user
    SELECT EXISTS(
        SELECT 1 FROM tasks 
        WHERE id = p_task_id AND user_id = p_user_id
    ) INTO v_task_exists;

    IF NOT v_task_exists THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'Task not found or unauthorized'
        );
    END IF;

    -- Check if already completed
    SELECT completed INTO v_already_completed
    FROM tasks
    WHERE id = p_task_id;

    IF v_already_completed THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'Task already completed'
        );
    END IF;

    -- Update task
    UPDATE tasks 
    SET 
        completed = TRUE,
        completed_at = NOW(),
        pomodoro_count = GREATEST(pomodoro_count, p_pomodoro_count),
        updated_at = NOW(),
        version = version + 1
    WHERE id = p_task_id AND user_id = p_user_id;

    -- Update stats (upsert in case stats don't exist)
    INSERT INTO stats (
        user_id,
        completed_tasks,
        tasks_completed_today,
        total_tasks,
        updated_at
    )
    VALUES (
        p_user_id,
        1,
        1,
        1,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        completed_tasks = stats.completed_tasks + 1,
        tasks_completed_today = stats.tasks_completed_today + 1,
        updated_at = NOW();

    -- Return success with updated data
    SELECT json_build_object(
        'success', TRUE,
        'task_id', p_task_id,
        'completed_at', NOW()
    ) INTO v_result;

    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        -- Return error details
        RETURN json_build_object(
            'success', FALSE,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION complete_task_with_stats(UUID, UUID, INT) TO authenticated;

-- ============================================================================
-- FUNCTION: uncomplete_task_with_stats
-- ============================================================================

/**
 * Atomically uncomplete a task and update user statistics.
 * This is the reverse operation of complete_task_with_stats.
 * 
 * @param p_task_id UUID - The task ID to uncomplete
 * @param p_user_id UUID - The user ID (for security check)
 * @returns JSON with success status
 */
CREATE OR REPLACE FUNCTION uncomplete_task_with_stats(
    p_task_id UUID,
    p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
    v_task_exists BOOLEAN;
    v_is_completed BOOLEAN;
BEGIN
    -- Check if task exists and belongs to user
    SELECT EXISTS(
        SELECT 1 FROM tasks 
        WHERE id = p_task_id AND user_id = p_user_id
    ) INTO v_task_exists;

    IF NOT v_task_exists THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'Task not found or unauthorized'
        );
    END IF;

    -- Check if actually completed
    SELECT completed INTO v_is_completed
    FROM tasks
    WHERE id = p_task_id;

    IF NOT v_is_completed THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'Task is not completed'
        );
    END IF;

    -- Update task
    UPDATE tasks 
    SET 
        completed = FALSE,
        completed_at = NULL,
        updated_at = NOW(),
        version = version + 1
    WHERE id = p_task_id AND user_id = p_user_id;

    -- Update stats (ensure they exist)
    UPDATE stats
    SET 
        completed_tasks = GREATEST(completed_tasks - 1, 0),
        tasks_completed_today = GREATEST(tasks_completed_today - 1, 0),
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Return success
    SELECT json_build_object(
        'success', TRUE,
        'task_id', p_task_id
    ) INTO v_result;

    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION uncomplete_task_with_stats(UUID, UUID) TO authenticated;

-- ============================================================================
-- FUNCTION: delete_task_with_cleanup
-- ============================================================================

/**
 * Atomically delete a task and its associated data (subtasks, sessions).
 * Updates statistics accordingly.
 * 
 * @param p_task_id UUID - The task ID to delete
 * @param p_user_id UUID - The user ID (for security check)
 * @returns JSON with success status and counts of deleted items
 */
CREATE OR REPLACE FUNCTION delete_task_with_cleanup(
    p_task_id UUID,
    p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
    v_task_exists BOOLEAN;
    v_was_completed BOOLEAN;
    v_subtasks_deleted INT;
    v_sessions_deleted INT;
BEGIN
    -- Check if task exists and belongs to user
    SELECT EXISTS(
        SELECT 1 FROM tasks 
        WHERE id = p_task_id AND user_id = p_user_id
    ) INTO v_task_exists;

    IF NOT v_task_exists THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'Task not found or unauthorized'
        );
    END IF;

    -- Get task completion status before deletion
    SELECT completed INTO v_was_completed
    FROM tasks
    WHERE id = p_task_id;

    -- Delete subtasks
    DELETE FROM subtasks
    WHERE task_id = p_task_id;
    GET DIAGNOSTICS v_subtasks_deleted = ROW_COUNT;

    -- Update sessions (set task_id to NULL instead of deleting for history)
    UPDATE sessions
    SET task_id = NULL
    WHERE task_id = p_task_id;
    GET DIAGNOSTICS v_sessions_deleted = ROW_COUNT;

    -- Delete the task
    DELETE FROM tasks
    WHERE id = p_task_id AND user_id = p_user_id;

    -- Update stats
    UPDATE stats
    SET 
        total_tasks = GREATEST(total_tasks - 1, 0),
        completed_tasks = CASE 
            WHEN v_was_completed THEN GREATEST(completed_tasks - 1, 0)
            ELSE completed_tasks
        END,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Return success with counts
    SELECT json_build_object(
        'success', TRUE,
        'task_id', p_task_id,
        'subtasks_deleted', v_subtasks_deleted,
        'sessions_updated', v_sessions_deleted
    ) INTO v_result;

    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_task_with_cleanup(UUID, UUID) TO authenticated;

-- ============================================================================
-- FUNCTION: bulk_update_task_order
-- ============================================================================

/**
 * Atomically update the order of multiple tasks.
 * Used for drag-and-drop reordering.
 * 
 * @param p_user_id UUID - The user ID (for security check)
 * @param p_task_orders JSONB - Array of {id: UUID, order: INT} objects
 * @returns JSON with success status and number of tasks updated
 */
CREATE OR REPLACE FUNCTION bulk_update_task_order(
    p_user_id UUID,
    p_task_orders JSONB
)
RETURNS JSON AS $$
DECLARE
    v_task_order JSONB;
    v_task_id UUID;
    v_order INT;
    v_count INT := 0;
BEGIN
    -- Iterate through each task order
    FOR v_task_order IN SELECT * FROM jsonb_array_elements(p_task_orders)
    LOOP
        v_task_id := (v_task_order->>'id')::UUID;
        v_order := (v_task_order->>'order')::INT;

        -- Update task order if it belongs to the user
        UPDATE tasks
        SET 
            "order" = v_order,
            updated_at = NOW(),
            version = version + 1
        WHERE id = v_task_id AND user_id = p_user_id;

        IF FOUND THEN
            v_count := v_count + 1;
        END IF;
    END LOOP;

    RETURN json_build_object(
        'success', TRUE,
        'tasks_updated', v_count
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION bulk_update_task_order(UUID, JSONB) TO authenticated;

-- ============================================================================
-- NOTES
-- ============================================================================

-- Usage examples:

-- Complete a task:
-- SELECT complete_task_with_stats(
--     'task-uuid-here'::UUID,
--     'user-uuid-here'::UUID,
--     5 -- pomodoro count
-- );

-- Uncomplete a task:
-- SELECT uncomplete_task_with_stats(
--     'task-uuid-here'::UUID,
--     'user-uuid-here'::UUID
-- );

-- Delete a task with cleanup:
-- SELECT delete_task_with_cleanup(
--     'task-uuid-here'::UUID,
--     'user-uuid-here'::UUID
-- );

-- Bulk update task order:
-- SELECT bulk_update_task_order(
--     'user-uuid-here'::UUID,
--     '[
--         {"id": "task-1-uuid", "order": 0},
--         {"id": "task-2-uuid", "order": 1},
--         {"id": "task-3-uuid", "order": 2}
--     ]'::JSONB
-- );
