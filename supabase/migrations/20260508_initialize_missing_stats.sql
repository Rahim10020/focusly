-- Migration: Initialize missing user stats
-- Description: Creates stats entries for all users without stats
-- This ensures all users appear in the leaderboard, even with zero activity

-- Insert stats for users without existing stats
INSERT INTO stats (user_id, total_sessions, completed_tasks, total_tasks, streak, total_focus_time, longest_streak, last_active_date)
SELECT 
  p.id, 
  0 AS total_sessions,
  0 AS completed_tasks,
  0 AS total_tasks,
  0 AS streak,
  0 AS total_focus_time,
  0 AS longest_streak,
  NOW() AS last_active_date
FROM profiles p
WHERE p.id NOT IN (SELECT user_id FROM stats)
ON CONFLICT (user_id) DO NOTHING;

-- Log the operation
DO $$ 
DECLARE
  affected_rows INTEGER;
BEGIN
  SELECT COUNT(*) INTO affected_rows 
  FROM stats 
  WHERE created_at >= NOW() - INTERVAL '1 minute' 
  AND total_sessions = 0 
  AND completed_tasks = 0;
  
  RAISE NOTICE 'Initialized % user stats entries', affected_rows;
END $$;
