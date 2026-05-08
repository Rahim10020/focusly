-- Migration: Create trigger for automatic stats initialization on new user signup
-- Description: Automatically creates a stats entry with default values when a new user is created
-- This ensures every user who signs up will appear in the leaderboard

-- Create function to initialize stats for new users
CREATE OR REPLACE FUNCTION initialize_user_stats()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Insérer une entrée stats avec des valeurs par défaut (0)
  INSERT INTO stats (
    user_id, 
    total_sessions, 
    completed_tasks, 
    total_tasks, 
    streak, 
    total_focus_time, 
    longest_streak, 
    last_active_date
  ) VALUES (
    NEW.id,
    0,
    0,
    0,
    0,
    0,
    0,
    NOW()
  ) ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END $$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_initialize_stats_on_profile_create ON profiles;

-- Create trigger that fires after a new profile is inserted
CREATE TRIGGER trigger_initialize_stats_on_profile_create
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION initialize_user_stats();

-- Comment the trigger
COMMENT ON TRIGGER trigger_initialize_stats_on_profile_create ON profiles IS 'Automatically creates stats entry with default values for new users';
