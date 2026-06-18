# LiveListen — Architecture

> Maintained by the **architect** agent. Update this when structure changes.

## Overview
Next.js 16 App Router frontend talking to Supabase for auth + data. No separate
backend; server components / route handlers use the Supabase server client.

## Layers
- **Routing / UI** — `src/app/**` (App Router), `src/components/**`.
- **Auth** — Supabase cookie sessions (`@supabase/ssr`). Proxy (`src/proxy.ts`, the
  Next 16 successor to `middleware.ts`) gates `/developer` by `ADMIN_EMAILS`;
  `/profile` requires a session.
- **Data** — Supabase Postgres. `saved_performances` is per-user, RLS-protected
  (`supabase/saved.sql`). Keep DB access in server code / `src/lib/**`, not client components.
- **Edge concerns** — `src/proxy.ts`.

## Conventions
- Read the installed Next.js docs before using framework APIs (breaking changes).
- TypeScript strict. Server-side data access only; never expose service keys client-side.

## Known gaps (fuel for TASKS.md)
- `/auth/callback` error handling is thin (missing code → throws instead of redirecting).
- `src/app/artist/[name]/page.tsx` has no error handling on the Supabase fetch; a network failure causes an infinite spinner.
- `src/app/search/page.tsx` — `fetchPerformances` has no try/catch; errors are silent (empty results). Also no AbortController, so stale responses can race.
- `src/app/venues/page.tsx` — no error handling or empty state on the Supabase fetch.
- No CSP headers yet.
- Env var validation is missing; bad config fails silently.
- `Performance` and `WatchSource` interfaces are duplicated in `search/page.tsx` and `artist/[name]/page.tsx`; shared types module missing.
- `savedStore` and `developer/layout.tsx` have zero unit tests.
- No skip-to-content link; keyboard/screen-reader users must tab the full nav on every page.
- `/profile` and `/developer` have no `noindex` metadata (robots.txt alone is insufficient for some indexers).
- Developer dashboard queries are unbounded (no `.limit()`); will be slow on large tables.
