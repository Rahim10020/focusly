-- Expand user_preferences table to support all preference fields
-- This migration adds missing columns to the user_preferences table

-- Check if columns exist before adding them (to avoid errors on re-run)
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS theme VARCHAR(10) DEFAULT 'system',
ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sound_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS daily_goal INTEGER DEFAULT 8,
ADD COLUMN IF NOT EXISTS focus_time_default INTEGER DEFAULT 25,
ADD COLUMN IF NOT EXISTS break_time_default INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';

-- Migrate data from old theme_preference to new theme column if it exists
UPDATE public.user_preferences
SET theme = CASE 
    WHEN theme_preference = 'light' THEN 'light'
    WHEN theme_preference = 'dark' THEN 'dark'
    ELSE 'system'
END
WHERE theme IS NULL OR theme = 'system';

-- Drop old column if migration is successful
-- ALTER TABLE public.user_preferences DROP COLUMN IF EXISTS theme_preference;
