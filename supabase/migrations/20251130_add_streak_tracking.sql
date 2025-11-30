-- Migration: Add streak tracking fields to stats table
-- Description: Adds fields for timezone-aware streak tracking

-- Add new columns to stats table
ALTER TABLE stats 
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active_date TIMESTAMPTZ;

-- Add index for last active date queries
CREATE INDEX IF NOT EXISTS idx_stats_last_active ON stats(last_active_date);

-- Add index for users with active streaks
CREATE INDEX IF NOT EXISTS idx_stats_active_streaks ON stats(streak) WHERE streak > 0;

-- Comment the new columns
COMMENT ON COLUMN stats.longest_streak IS 'Longest streak achieved by the user';
COMMENT ON COLUMN stats.last_active_date IS 'Last date the user had activity (timezone-aware)';
