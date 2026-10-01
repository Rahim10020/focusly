# Focusly

> A modern productivity app that combines task management, Pomodoro focus sessions, recurring tasks, streaks, and productivity insights in one focused workspace.

Focusly helps you plan what matters, work in focused intervals, and build consistent habits without unnecessary complexity.

## Features

- **Task management** — Create, organize, prioritize, and schedule tasks with due dates and categories.
- **Recurring tasks** — Automate daily, weekly, monthly, and custom schedules.
- **Pomodoro timer** — Run work and break sessions with sound feedback.
- **Productivity tracking** — Monitor focus time, completed tasks, streaks, and completion statistics.
- **Insights and visualizations** — Explore charts, heatmaps, and productivity breakdowns by domain.
- **Achievements** — Earn milestones based on your activity and progress.
- **Social features** — Connect with friends and compare progress on the leaderboard.
- **Data export** — Export your data to PDF, CSV, and iCalendar formats.
- **Account settings** — Manage your profile and application preferences.

## Tech stack

- [Next.js 16](https://nextjs.org/) with the App Router
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) for authentication, PostgreSQL, Row Level Security, and Edge Functions
- [Vitest](https://vitest.dev/) for testing
- [Sentry](https://sentry.io/) for error monitoring

## Prerequisites

- Node.js and npm
- A Supabase project
- Supabase CLI, if you need to apply migrations or deploy Edge Functions

## Getting started

1. Clone the repository and install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Configure the required variables in `.env.local`.

4. Start the development server:

   ```bash
   npm run dev
   ```

   The development server runs with Webpack. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment variables

The following variables are required or commonly used:

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public URL of your Supabase project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase anonymous key used by the browser client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase service-role key; never expose it to the client |
| `SENTRY_DSN` | Server-side Sentry DSN |
| `NEXT_PUBLIC_SENTRY_DSN` | Browser-side Sentry DSN |
| `SUPABASE_PROJECT_ID` | Supabase project ID, required when regenerating database types |

See `.env.example` for the complete list of supported variables.

## Project structure

```text
src/
├── app/
│   ├── (app)/       # Authenticated application routes
│   ├── (auth)/      # Sign-in and sign-up routes
│   ├── (public)/    # Public and landing pages
│   └── api/         # API routes and middleware pipelines
├── components/      # Shared React components and providers
└── lib/
    ├── api/         # API middleware and validation schemas
    ├── domain/      # Database-agnostic business logic and services
    └── supabase/    # Browser and server Supabase clients

supabase/
├── functions/       # Supabase Edge Functions
└── migrations/      # Date-prefixed SQL migrations

src/__tests__/       # Tests and test utilities
```

Business logic belongs in `src/lib/domain/services/` so it remains database-agnostic and unit-testable. API routes should use the middleware composition pattern and validation schemas already established in the project.

## Available commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server with Webpack |
| `npm run build` | Create a production build with Webpack |
| `npm run type-check` | Run TypeScript without emitting files |
| `npm run test` | Run the Vitest test suite |
| `npx vitest run <file>` | Run one Vitest file |
| `npm run lint` | Run ESLint |
| `npm run supabase:types` | Regenerate Supabase database types |

The repository currently has pre-existing ESLint errors and warnings, so use lint to avoid introducing new issues. For validation, prioritize `npm run type-check` and targeted tests.

## Supabase

### Database migrations

Migrations are stored as plain SQL files in `supabase/migrations/`. Apply them with the Supabase CLI:

```bash
supabase db push
```

Regenerate the database types after schema changes:

```bash
npm run supabase:types
```

This requires `SUPABASE_PROJECT_ID` to be configured.

### Check streaks Edge Function

The `check-streaks` function checks active user streaks and resets streaks after inactivity. Deploy it with:

```bash
supabase functions deploy check-streaks
```

Configure the function secrets and its daily cron trigger in the Supabase dashboard. See [`supabase/functions/check-streaks/README.md`](supabase/functions/check-streaks/README.md) for the complete setup and manual testing instructions.

## Security notes

- Browser requests use the anon key and are protected by Supabase Row Level Security.
- Server routes may use the service-role key when administrative access is required.
- Never commit `.env.local` or expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code.

## Deployment

Focusly can be deployed to Vercel or another Next.js-compatible platform:

1. Configure the environment variables in the hosting provider.
2. Build the application with `npm run build`.
3. Apply Supabase migrations with `supabase db push`.
4. Deploy the `check-streaks` Edge Function with `supabase functions deploy check-streaks`.
5. Configure the scheduled trigger for the Edge Function in Supabase.

## Contributing

1. Create a focused branch for your change.
2. Keep domain logic database-agnostic and add or update tests where appropriate.
3. Run `npm run type-check` and relevant Vitest tests before opening a pull request.
4. Avoid adding new lint errors.

## License

No license has been specified for this repository yet.

**Last updated:** October 1, 2026
