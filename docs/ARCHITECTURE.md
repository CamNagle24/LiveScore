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
- No sitemap, loading skeletons, or CSP headers yet.
- Env var validation is missing; bad config fails silently.
- `Performance` and `WatchSource` types are duplicated between `artist/[name]/page.tsx` and `search/page.tsx`; should be extracted to `src/types/performance.ts`.
- `src/app/search/page.tsx` `fetchPerformances` has no error handling (silent empty results on Supabase error).
- `src/app/search/page.tsx` has no AbortController; stale responses can race newer ones.
- `src/app/global-error.tsx` is missing; root layout errors are uncaught.
- `SuggestFooter` inputs lack `aria-label`; placeholder text alone is insufficient for accessibility.
- `savedStore` and `developer/layout.tsx` have no test coverage.
