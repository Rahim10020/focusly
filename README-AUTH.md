# Focusly Authentication Setup Guide

This guide explains how to set up user accounts and data persistence for the Focusly app.

## Overview

The app now supports user authentication with NextAuth.js and Supabase. Users can create accounts, log in, and have their tasks, stats, and achievements saved across devices.

## Setup Instructions

### 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to Settings > API to get your project URL and anon key
4. Go to the SQL Editor and run the schema from `supabase-schema.sql`

### 2. Environment Variables

Update your `.env.local` file with your Supabase credentials:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Generate NextAuth Secret

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

### 4. Database Schema

The `supabase-schema.sql` file contains all the necessary tables:
- `tasks` - User tasks with subtasks
- `stats` - User productivity statistics
- `sessions` - Pomodoro sessions
- `tags` - User-defined tags
- `achievements` - Unlocked achievements

**Important**: The schema does NOT try to modify the `auth.users` table, which is managed by Supabase. Just run the entire SQL file in the Supabase SQL Editor.

## Features Implemented

### ✅ Completed
- NextAuth.js authentication setup
- Supabase client configuration
- Login/Signup pages
- Session management
- Auth-protected main page
- Logout functionality
- Database schema

### 🔄 Partially Implemented
- Task synchronization (needs completion of hook modifications)

### 📋 Still To Do
- Complete the hook modifications for database sync
- Implement stats, achievements, and tags database sync
- Add data migration from localStorage to database
- Add loading states and error handling

## How It Works

1. **Unauthenticated users**: Data stored in localStorage
2. **Authenticated users**: Data synced with Supabase database
3. **Account creation**: Users can sign up with email/password
4. **Data persistence**: Tasks, stats, and achievements saved per user

## Next Steps

To complete the implementation:

1. Finish modifying the hooks (`useTasks`, `useStats`, `useAchievements`, `useTags`) to sync with database
2. Add data migration when users log in
3. Implement proper error handling and offline support
4. Add account settings and data export

## Testing

1. Start the development server: `npm run dev`
2. Visit the app - you should see the authentication landing page
3. Create an account or sign in
4. Tasks and data should persist across sessions

## Security Notes

- Row Level Security (RLS) is enabled on all tables
- Users can only access their own data
- Authentication handled by Supabase Auth
- JWT tokens managed by NextAuth.js