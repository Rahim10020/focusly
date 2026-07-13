# Focusly

Focusly is a productivity app to help you plan, track, and finish what matters. It combines task management, Pomodoro focus sessions, and lightweight insights so you can stay consistent without feeling overwhelmed.

**What you can do**
- Create and organize tasks with priorities, due dates, and categories
- Recurring tasks: daily, weekly, monthly, or custom schedules
- Pomodoro timer with work/break sessions and sound feedback
- Track progress with streaks, focus time, and completion stats
- Visualize productivity with charts, heatmaps, and domain breakdowns
- Manage your profile and settings
- Export data to PDF, CSV, and iCal
- Connect with friends and view the leaderboard
- Earn achievements based on your productivity

**How the project is organized**
- Web app built with Next.js 16 and React 19
- TypeScript for type safety
- Tailwind CSS for styling
- Supabase for auth, database, and edge functions
- Vitest for testing

**Getting started**
1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and fill in your Supabase and Sentry credentials
3. Run the app locally: `npm run dev`
4. Open http://localhost:3000

**Quality checks**
- `npm run lint` — ESLint
- `npm run type-check` — TypeScript
- `npm run test` — Vitest tests
- `npm run build` — Production build

**Environment variables**
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-side)
- `SENTRY_DSN` — Sentry server DSN for error monitoring
- `NEXT_PUBLIC_SENTRY_DSN` — Sentry public DSN for browser monitoring

**Deployment**
- Deploy to Vercel or any Next.js-compatible platform
- Run Supabase migrations: `supabase db push`
- Deploy edge function: `supabase functions deploy check-streaks`

**Last updated:** July 2026
