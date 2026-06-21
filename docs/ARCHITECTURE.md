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
- 14 `[routine]` PRs (#32–#46) covering most of the previously-listed gaps (CSP, env validation, AbortController, ARIA, `/artists` error handling, pagination, card keyboard a11y, `/artists`/`/venues`/`sitemap.ts`/`error.tsx` tests, thumbnail `next/image`) are open against `main` but unmerged as of this pass — re-check this list once they land instead of re-queuing the same work.
- Raw `<img>` tags remain in `artist/[name]/page.tsx`, `artists/page.tsx`, and `profile/page.tsx` (search's migration is in flight via #46); same `next/image` LCP lint warnings.
- `suggestions` table (`supabase/suggestions.sql`) accepts anonymous inserts with `with check (true)` and no rate limiting or spam guard — open to bot abuse.
- No `src/app/not-found.tsx`; unmatched routes fall back to the generic Next.js 404.
- `PageNav` (`src/components/PageNav.tsx`) has no test coverage despite gating sign-in/sign-out and active-tab state on every page.
- `profile/page.tsx` still defines local `Performance`/`WatchSource` types instead of importing the shared `src/types/performance.ts`.
- `LoginForm.tsx`, `artist/[name]/page.tsx`, and `profile/page.tsx` have zero test coverage for their primary user flows.
- `PageNav`'s account dropdown has no `role="menu"`/`aria-expanded`/Escape handling; its active tab has no `aria-current`.
- Dynamic status/error messages (search error banner, artist load error, `SuggestFooter` states) render with no `aria-live` region.
