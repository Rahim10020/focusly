# AGENTS.md

Focusly: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind 4 + Supabase (auth, Postgres, edge functions) + Vitest. Pure-feature app, no monorepo.

## Commands

- `npm run dev` / `npm run build` — run with `--webpack` (custom splitChunks config in `next.config.ts` depends on it; don't drop the flag).
- `npm run type-check` — `tsc --noEmit`; currently passes.
- `npm run test` / `npx vitest run <file>` — Vitest. `globals: true` and jest-dom are set up, so `describe/it/expect` need no imports. Tests live in `src/__tests__/` or colocated as `*.test.tsx`.
- `npm run lint` — currently reports ~124 pre-existing errors + ~50 warnings. Not a clean gate; use it to avoid *adding* new issues.
- **Broken scripts** (`scripts/` dir is not committed): `validate`, `test:security`, `check:env`, `cache:clear`, `db:migrate`, `db:migrate:bash` all fail. For validation use `type-check` + targeted tests instead.

## Structure

- Route groups: `(app)` authenticated UI, `(auth)` signin/signup, `(public)` landing. Feature pages sit under `src/app/(app)/<feature>/` with page-local components in `_components/`.
- Pure/business logic lives in `src/lib/domain/services/` (`TaskService`, `StreakService`, `RecurrenceService`, …) — keep it DB-agnostic and unit-testable.
- API routes: `src/app/api/**/route.ts` wrap handlers with the middleware `compose()` chain from `src/lib/api/middleware` (`withErrorHandling`, `withAuthRequired`, `withValidation`, `withLogging`, `withRateLimit`). New routes should follow that pattern and put schemas in `src/lib/api/schemas`.
- Path alias `@/*` → `src/*` (also aliased in Vitest). Strict TS.

## Supabase

- `src/lib/supabase/client.ts` (anon key, RLS-enforced) vs `server.ts` (`getSupabaseAdmin`, service role, bypasses RLS — server routes only).
- DB types are generated: `database.types.ts` via `npm run supabase:types` (requires `SUPABASE_PROJECT_ID`). Regenerate after schema changes instead of hand-editing.
- Migrations are plain SQL in `supabase/migrations/` (date-prefixed). Apply with `supabase db push`, not the broken `db:migrate` script.
- Edge function: `supabase/functions/check-streaks` is a Deno function (deploy: `supabase functions deploy check-streaks`; cron wired in Supabase dashboard).
- `.env.example` lists the needed env vars; copy to `.env.local` for dev. `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY` are required.

## Notes

- `todo.txt` is the current work log (in French) and lists known open bugs — check it before fixing sync/UI issues.
- Sentry is wired via `src/components/providers/SentryProvider.tsx` and `src/instrumentation.ts`; both DSNs in env.
- No CI workflows or pre-commit hooks in the repo.