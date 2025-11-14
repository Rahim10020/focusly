-- Note: auth.users table is managed by Supabase Auth and already has RLS enabled

-- Création des tables principales
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    pomodoro_count INTEGER DEFAULT 0,
    priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
    tags TEXT[],
    due_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    "order" INTEGER DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    sub_domain TEXT
);

CREATE TABLE IF NOT EXISTS public.subtasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    total_sessions INTEGER DEFAULT 0,
    completed_tasks INTEGER DEFAULT 0,
    total_tasks INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    total_focus_time INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    tasks_completed_today INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id)
);

-- Note: We don't add a direct foreign key between stats and profiles
-- because users might have stats before creating a profile.
-- Instead, we use manual joins in queries where both tables reference auth.users(id)

CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    duration INTEGER NOT NULL,
    type TEXT CHECK (type IN ('work', 'break')) NOT NULL,
    completed BOOLEAN DEFAULT TRUE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    achievement_id TEXT NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.friends (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(sender_id, receiver_id)
);

CREATE TABLE IF NOT EXISTS public.stat_visibility (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    stat_field TEXT NOT NULL CHECK (stat_field IN ('total_sessions', 'completed_tasks', 'total_tasks', 'streak', 'total_focus_time', 'longest_streak', 'tasks_completed_today')),
    visible_to_friends BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, stat_field)
);


ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stat_visibility ENABLE ROW LEVEL SECURITY;


-- Row Level Security Policies

-- Tasks policies
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
CREATE POLICY "Users can view their own tasks" ON public.tasks
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own tasks" ON public.tasks;
CREATE POLICY "Users can insert their own tasks" ON public.tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
CREATE POLICY "Users can update their own tasks" ON public.tasks
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;
CREATE POLICY "Users can delete their own tasks" ON public.tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Subtasks policies
DROP POLICY IF EXISTS "Users can view their own subtasks" ON public.subtasks;
CREATE POLICY "Users can view their own subtasks" ON public.subtasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tasks
            WHERE tasks.id = subtasks.task_id
            AND tasks.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert their own subtasks" ON public.subtasks;
CREATE POLICY "Users can insert their own subtasks" ON public.subtasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tasks
            WHERE tasks.id = subtasks.task_id
            AND tasks.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update their own subtasks" ON public.subtasks;
CREATE POLICY "Users can update their own subtasks" ON public.subtasks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.tasks
            WHERE tasks.id = subtasks.task_id
            AND tasks.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete their own subtasks" ON public.subtasks;
CREATE POLICY "Users can delete their own subtasks" ON public.subtasks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.tasks
            WHERE tasks.id = subtasks.task_id
            AND tasks.user_id = auth.uid()
        )
    );

-- Stats policies
DROP POLICY IF EXISTS "Users can view their own stats" ON public.stats;
DROP POLICY IF EXISTS "Users can insert their own stats" ON public.stats;
DROP POLICY IF EXISTS "Users can update their own stats" ON public.stats;
DROP POLICY IF EXISTS "Users can view all stats" ON public.stats;

-- Sessions policies
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.sessions;
CREATE POLICY "Users can view their own sessions" ON public.sessions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.sessions;
CREATE POLICY "Users can insert their own sessions" ON public.sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own sessions" ON public.sessions;
CREATE POLICY "Users can update their own sessions" ON public.sessions
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.sessions;
CREATE POLICY "Users can delete their own sessions" ON public.sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Tags policies
DROP POLICY IF EXISTS "Users can view their own tags" ON public.tags;
CREATE POLICY "Users can view their own tags" ON public.tags
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own tags" ON public.tags;
CREATE POLICY "Users can insert their own tags" ON public.tags
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own tags" ON public.tags;
CREATE POLICY "Users can update their own tags" ON public.tags
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own tags" ON public.tags;
CREATE POLICY "Users can delete their own tags" ON public.tags
    FOR DELETE USING (auth.uid() = user_id);

-- Achievements policies
DROP POLICY IF EXISTS "Users can view their own achievements" ON public.achievements;
CREATE POLICY "Users can view their own achievements" ON public.achievements
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own achievements" ON public.achievements;
CREATE POLICY "Users can insert their own achievements" ON public.achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own achievements" ON public.achievements;
CREATE POLICY "Users can update their own achievements" ON public.achievements
    FOR UPDATE USING (auth.uid() = user_id);

-- Profiles policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Friends policies
DROP POLICY IF EXISTS "Users can view their friendships" ON public.friends;
CREATE POLICY "Users can view their friendships" ON public.friends
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send friend requests" ON public.friends;
CREATE POLICY "Users can send friend requests" ON public.friends
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update friend requests they received" ON public.friends;
CREATE POLICY "Users can update friend requests they received" ON public.friends
    FOR UPDATE USING (auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can delete their own friend requests" ON public.friends;
CREATE POLICY "Users can delete their own friend requests" ON public.friends
    FOR DELETE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Stat visibility policies
DROP POLICY IF EXISTS "Users can view their own stat visibility" ON public.stat_visibility;
CREATE POLICY "Users can view their own stat visibility" ON public.stat_visibility
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own stat visibility" ON public.stat_visibility;
CREATE POLICY "Users can insert their own stat visibility" ON public.stat_visibility
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own stat visibility" ON public.stat_visibility;
CREATE POLICY "Users can update their own stat visibility" ON public.stat_visibility
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own stat visibility" ON public.stat_visibility;
CREATE POLICY "Users can delete their own stat visibility" ON public.stat_visibility
    FOR DELETE USING (auth.uid() = user_id);

-- Stats policies (updated for public viewing)
CREATE POLICY "Users can view all stats" ON public.stats
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own stats" ON public.stats;
CREATE POLICY "Users can insert their own stats" ON public.stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own stats" ON public.stats;
CREATE POLICY "Users can update their own stats" ON public.stats
    FOR UPDATE USING (auth.uid() = user_id);



-- Functions for updating updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updating updated_at timestamps
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subtasks_updated_at ON public.subtasks;
CREATE TRIGGER update_subtasks_updated_at BEFORE UPDATE ON public.subtasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stats_updated_at ON public.stats;
CREATE TRIGGER update_stats_updated_at BEFORE UPDATE ON public.stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sessions_updated_at ON public.sessions;
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tags_updated_at ON public.tags;
CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON public.tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_achievements_updated_at ON public.achievements;
CREATE TRIGGER update_achievements_updated_at BEFORE UPDATE ON public.achievements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_friends_updated_at ON public.friends;
CREATE TRIGGER update_friends_updated_at BEFORE UPDATE ON public.friends
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stat_visibility_updated_at ON public.stat_visibility;
CREATE TRIGGER update_stat_visibility_updated_at BEFORE UPDATE ON public.stat_visibility
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
