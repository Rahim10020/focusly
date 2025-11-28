# Row Level Security (RLS) Policies Documentation

This document describes all Row Level Security policies implemented in the Focusly Supabase database.

## 🔒 Security Model

All tables use Row Level Security (RLS) to ensure users can only access their own data. The `auth.uid()` function returns the authenticated user's ID from the JWT token.

---

## 📋 Tasks Table

**Table:** `tasks`

### Policies:

#### SELECT (View)
```sql
CREATE POLICY "Users can view their own tasks"
ON tasks FOR SELECT
USING (auth.uid() = user_id);
```
- ✅ Users can view tasks they created
- ❌ Users cannot view other users' tasks

#### INSERT (Create)
```sql
CREATE POLICY "Users can insert their own tasks"
ON tasks FOR INSERT
WITH CHECK (auth.uid() = user_id);
```
- ✅ Users can create tasks for themselves
- ❌ Users cannot create tasks for other users

#### UPDATE (Modify)
```sql
CREATE POLICY "Users can update their own tasks"
ON tasks FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```
- ✅ Users can update their own tasks
- ❌ Users cannot modify other users' tasks
- ⚠️ The `user_id` field cannot be changed to another user

#### DELETE (Remove)
```sql
CREATE POLICY "Users can delete their own tasks"
ON tasks FOR DELETE
USING (auth.uid() = user_id);
```
- ✅ Users can delete their own tasks
- ❌ Users cannot delete other users' tasks

---

## 📊 Stats Table

**Table:** `stats`

### Policies:

#### SELECT (View)
```sql
CREATE POLICY "Users can view their own stats"
ON stats FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Friends can view stats based on visibility"
ON stats FOR SELECT
USING (
  auth.uid() IN (
    SELECT CASE
      WHEN sender_id = user_id THEN receiver_id
      WHEN receiver_id = user_id THEN sender_id
    END
    FROM friends
    WHERE (sender_id = user_id OR receiver_id = user_id)
      AND status = 'accepted'
  )
  AND EXISTS (
    SELECT 1 FROM stat_visibility
    WHERE stat_visibility.user_id = stats.user_id
      AND visible_to_friends = true
  )
);
```
- ✅ Users can always view their own stats
- ✅ Friends can view stats if visibility is enabled
- ❌ Non-friends cannot view stats

#### INSERT/UPDATE (Modify)
```sql
CREATE POLICY "Users can modify their own stats"
ON stats FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
ON stats FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```
- ✅ Users can create/update their own stats
- ❌ Users cannot modify other users' stats

---

## 👥 Friends Table

**Table:** `friends`

### Policies:

#### SELECT (View)
```sql
CREATE POLICY "Users can see friendships they're part of"
ON friends FOR SELECT
USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);
```
- ✅ Users can view friend requests they sent
- ✅ Users can view friend requests they received
- ❌ Users cannot view other users' friendships

#### INSERT (Create)
```sql
CREATE POLICY "Users can create friend requests as sender"
ON friends FOR INSERT
WITH CHECK (auth.uid() = sender_id);
```
- ✅ Users can send friend requests
- ❌ Users cannot create friend requests on behalf of others

#### UPDATE (Modify)
```sql
CREATE POLICY "Only receiver can accept/reject requests"
ON friends FOR UPDATE
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);
```
- ✅ Receivers can accept/reject friend requests
- ❌ Senders cannot modify the status themselves

#### DELETE (Remove)
```sql
CREATE POLICY "Both parties can delete friendship"
ON friends FOR DELETE
USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);
```
- ✅ Either party can delete the friendship
- ✅ Users can cancel sent requests
- ✅ Users can reject received requests

---

## 🔔 Notifications Table

**Table:** `notifications`

### Policies:

#### SELECT (View)
```sql
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);
```
- ✅ Users can view their own notifications
- ❌ Users cannot view other users' notifications

#### UPDATE (Modify)
```sql
CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```
- ✅ Users can mark their notifications as read
- ❌ Users cannot modify other users' notifications

#### DELETE (Remove)
```sql
CREATE POLICY "Users can delete their own notifications"
ON notifications FOR DELETE
USING (auth.uid() = user_id);
```
- ✅ Users can delete their notifications
- ❌ Users cannot delete other users' notifications

---

## 🎯 Subtasks Table

**Table:** `subtasks`

### Policies:

#### SELECT (View)
```sql
CREATE POLICY "Users can view subtasks of their tasks"
ON subtasks FOR SELECT
USING (
  task_id IN (
    SELECT id FROM tasks WHERE user_id = auth.uid()
  )
);
```
- ✅ Users can view subtasks of their own tasks
- ❌ Users cannot view other users' subtasks

#### INSERT/UPDATE/DELETE (Modify)
```sql
CREATE POLICY "Users can modify subtasks of their tasks"
ON subtasks FOR INSERT
WITH CHECK (
  task_id IN (
    SELECT id FROM tasks WHERE user_id = auth.uid()
  )
);

-- Similar policies for UPDATE and DELETE
```
- ✅ Users can create/modify/delete subtasks of their tasks
- ❌ Users cannot modify subtasks of other users' tasks

---

## 🏆 Achievements Table

**Table:** `achievements`

### Policies:

#### SELECT (View)
```sql
CREATE POLICY "Users can view their own achievements"
ON achievements FOR SELECT
USING (auth.uid() = user_id);
```
- ✅ Users can view their unlocked achievements
- ❌ Users cannot view other users' achievements (unless via friends/leaderboard)

#### INSERT (Create)
```sql
CREATE POLICY "System can insert achievements"
ON achievements FOR INSERT
WITH CHECK (auth.uid() = user_id);
```
- ✅ System can unlock achievements for users
- ✅ Users can unlock achievements (via triggers/functions)

---

## ⏱️ Sessions Table

**Table:** `sessions`

### Policies:

#### SELECT (View)
```sql
CREATE POLICY "Users can view their own sessions"
ON sessions FOR SELECT
USING (auth.uid() = user_id);
```
- ✅ Users can view their Pomodoro sessions
- ❌ Users cannot view other users' sessions

#### INSERT/UPDATE/DELETE (Modify)
```sql
CREATE POLICY "Users can manage their own sessions"
ON sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Similar for UPDATE and DELETE
```
- ✅ Users can create/modify/delete their sessions
- ❌ Users cannot modify other users' sessions

---

## 🏷️ Tags Table

**Table:** `tags`

### Policies:

```sql
CREATE POLICY "Users can manage their own tags"
ON tags FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```
- ✅ Users can create/view/modify/delete their tags
- ❌ Users cannot access other users' tags

---

## 👤 Profiles Table

**Table:** `profiles`

### Policies:

#### SELECT (View)
```sql
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);
```
- ✅ All users can view all profiles (for friend search, leaderboard)
- ℹ️ This is intentional for social features

#### UPDATE (Modify)
```sql
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```
- ✅ Users can update their own profile
- ❌ Users cannot modify other users' profiles

---

## 🎨 User Preferences Table

**Table:** `user_preferences`

### Policies:

```sql
CREATE POLICY "Users can manage their own preferences"
ON user_preferences FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```
- ✅ Users can view/modify their theme preferences
- ❌ Users cannot access other users' preferences

---

## 🔧 Implementation Notes

### Service Role Key Usage

When using `SUPABASE_SERVICE_ROLE_KEY` in server-side code:

1. **Always validate the user session first**
   ```typescript
   const session = await getServerSession(authOptions);
   if (!session?.user?.id) {
     return new Response('Unauthorized', { status: 401 });
   }
   ```

2. **Filter all queries by the authenticated user**
   ```typescript
   const { data, error } = await supabaseAdmin
     .from('tasks')
     .select('*')
     .eq('user_id', session.user.id); // Critical!
   ```

3. **Never trust client input for user_id**
   ```typescript
   // ❌ WRONG - Client could send any user_id
   const { userId } = await request.json();
   
   // ✅ CORRECT - Always use session user_id
   const userId = session.user.id;
   ```

### Testing RLS Policies

To test that RLS is working:

```sql
-- Test as an authenticated user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub TO 'user-uuid-here';

-- Try to access another user's data (should return nothing)
SELECT * FROM tasks WHERE user_id != 'user-uuid-here';
```

---

## 📚 References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/sql-createpolicy.html)
