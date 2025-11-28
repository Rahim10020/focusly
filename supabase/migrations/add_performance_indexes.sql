-- Migration: Add performance indexes
-- Description: Adds composite and partial indexes to improve query performance
-- Created: 2024-11-28
-- Fixed: 2025-11-28 - Removed non-immutable functions from cache partial indexes

-- ============================================================================
-- TASKS TABLE INDEXES
-- ============================================================================

-- Index for querying incomplete tasks by user and due date
-- Used in: getActiveTasks(), getOverdueTasks(), getTasksDueToday()
CREATE INDEX IF NOT EXISTS idx_tasks_user_due_date_incomplete 
ON tasks(user_id, due_date) 
WHERE completed = FALSE;

-- Index for completed tasks by user and completion date
-- Used in: getCompletedTasks(), task history queries
CREATE INDEX IF NOT EXISTS idx_tasks_user_completed_at 
ON tasks(user_id, completed_at DESC) 
WHERE completed = TRUE;

-- Index for task ordering (drag and drop)
-- Used in: reorderTasks(), getTasksByOrder()
CREATE INDEX IF NOT EXISTS idx_tasks_user_order 
ON tasks(user_id, "order" ASC);

-- Index for filtering by priority
-- Used in: getTasksByPriority()
CREATE INDEX IF NOT EXISTS idx_tasks_user_priority 
ON tasks(user_id, priority) 
WHERE priority IS NOT NULL;

-- Index for filtering by sub_domain
-- Used in: domain-based filtering
CREATE INDEX IF NOT EXISTS idx_tasks_user_subdomain 
ON tasks(user_id, sub_domain) 
WHERE sub_domain IS NOT NULL;

-- Index for filtering by tags (GIN index for array contains)
-- Used in: getTasksByTag()
CREATE INDEX IF NOT EXISTS idx_tasks_tags 
ON tasks USING GIN(tags);


-- ============================================================================
-- SESSIONS TABLE INDEXES
-- ============================================================================

-- Index for sessions by user and date
-- Used in: getSessionsHistory(), productivity charts
CREATE INDEX IF NOT EXISTS idx_sessions_user_started_at 
ON sessions(user_id, started_at DESC);

-- Index for sessions by task
-- Used in: task-specific session queries
CREATE INDEX IF NOT EXISTS idx_sessions_task_started_at 
ON sessions(task_id, started_at DESC) 
WHERE task_id IS NOT NULL;

-- Index for completed sessions stats
-- Used in: calculating session statistics
CREATE INDEX IF NOT EXISTS idx_sessions_user_completed 
ON sessions(user_id, completed_at DESC) 
WHERE completed = TRUE;

-- ============================================================================
-- STATS TABLE INDEXES
-- ============================================================================

-- Index for leaderboard queries
-- Used in: /api/leaderboard
CREATE INDEX IF NOT EXISTS idx_stats_total_focus_time 
ON stats(total_focus_time DESC);

-- Index for streak calculations
-- Used in: streak maintenance queries
CREATE INDEX IF NOT EXISTS idx_stats_user_streak 
ON stats(user_id, streak DESC);

-- ============================================================================
-- NOTIFICATIONS TABLE INDEXES
-- ============================================================================

-- Index for unread notifications
-- Used in: notification queries, badge counts
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON notifications(user_id, created_at DESC) 
WHERE read = FALSE;

-- Index for notification type filtering
-- Used in: filtering by notification type
CREATE INDEX IF NOT EXISTS idx_notifications_user_type 
ON notifications(user_id, type, created_at DESC);

-- ============================================================================
-- FRIENDS TABLE INDEXES
-- ============================================================================

-- Index for friend requests (sender perspective)
-- Used in: sent friend requests queries
CREATE INDEX IF NOT EXISTS idx_friends_sender_status 
ON friends(sender_id, status, created_at DESC);

-- Index for friend requests (receiver perspective)
-- Used in: received friend requests queries
CREATE INDEX IF NOT EXISTS idx_friends_receiver_status 
ON friends(receiver_id, status, created_at DESC);

-- Index for accepted friendships lookup
-- Used in: getFriends(), checking if users are friends
CREATE INDEX IF NOT EXISTS idx_friends_accepted 
ON friends(sender_id, receiver_id) 
WHERE status = 'accepted';

-- ============================================================================
-- SUBTASKS TABLE INDEXES
-- ============================================================================

-- Index for subtasks by task
-- Used in: loading tasks with subtasks
CREATE INDEX IF NOT EXISTS idx_subtasks_task_created 
ON subtasks(task_id, created_at ASC);

-- Index for incomplete subtasks
-- Used in: counting incomplete subtasks
CREATE INDEX IF NOT EXISTS idx_subtasks_task_incomplete 
ON subtasks(task_id) 
WHERE completed = FALSE;

-- ============================================================================
-- ACHIEVEMENTS TABLE INDEXES
-- ============================================================================

-- Index for user achievements
-- Used in: loading user achievements
CREATE INDEX IF NOT EXISTS idx_achievements_user_unlocked 
ON achievements(user_id, unlocked_at DESC);

-- Index for specific achievement checks
-- Used in: checking if user has unlocked specific achievement
CREATE INDEX IF NOT EXISTS idx_achievements_user_achievement 
ON achievements(user_id, achievement_id);

-- ============================================================================
-- CACHE TABLE INDEXES (CORRIGÉ)
-- ============================================================================

-- Index pour cache key lookup (sur toutes les entrées, le filtre se fait en requête)
CREATE INDEX IF NOT EXISTS idx_cache_key 
ON cache(cache_key);

-- Index pour le nettoyage des entrées expirées (sur toutes les entrées)
CREATE INDEX IF NOT EXISTS idx_cache_expires_at_all 
ON cache(expires_at ASC);

-- ============================================================================
-- TAGS TABLE INDEXES
-- ============================================================================

-- Index for user tags
-- Used in: loading user tags, tag autocomplete
CREATE INDEX IF NOT EXISTS idx_tags_user_name 
ON tags(user_id, name);

-- ============================================================================
-- STAT_VISIBILITY TABLE INDEXES
-- ============================================================================

-- Index for visibility checks
-- Used in: checking if stats are visible to friends
CREATE INDEX IF NOT EXISTS idx_stat_visibility_user_field 
ON stat_visibility(user_id, stat_field, visible_to_friends);

-- ============================================================================
-- NOTES
-- ============================================================================

-- Pour les entrées de cache valides, filtre en requête : WHERE cache_key = ? AND expires_at > NOW()
-- Pour le nettoyage périodique : DELETE FROM cache WHERE expires_at < NOW()
-- Ces index non-partiels suffisent pour des performances optimales (surtout si la table cache reste petite)
-- Si la table grossit beaucoup, envisage un job cron pour DELETE périodique des expirés

-- To verify index usage, run:
-- EXPLAIN ANALYZE SELECT ... your query ...

-- To check index sizes:
-- SELECT
--     schemaname,
--     tablename,
--     indexname,
--     pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY pg_relation_size(indexrelid) DESC;

-- To identify missing indexes:
-- SELECT
--     schemaname,
--     tablename,
--     seq_scan,
--     seq_tup_read,
--     idx_scan,
--     seq_tup_read / seq_scan AS avg_seq_read
-- FROM pg_stat_user_tables
-- WHERE seq_scan > 0
-- ORDER BY seq_tup_read DESC;