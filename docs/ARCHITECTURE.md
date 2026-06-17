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
- No CSP headers yet; env var validation is missing (bad config fails silently).
- `src/app/search/page.tsx` has no AbortController; stale responses can race newer ones.
- `SuggestFooter` inputs lack `aria-label`; placeholder text alone is insufficient for accessibility.
- `/api/artists/search` has no input validation (unbounded `q`) or upstream fetch timeout.
- `src/app/artists/page.tsx` ignores the Supabase `error` object, same silent-failure class already fixed in `/search` and `/artist/[name]`.
- `ArtistCard` (`artists/page.tsx`) and `VenueCard` (`venues/page.tsx`) are click-only `<div>`s with no keyboard support, unlike the ARIA work planned for search-page cards.
- No test coverage for `/artists`, `/venues`, `sitemap.ts`, or `error.tsx`.
- Raw `<img>` tags throughout (`search`, `artist/[name]`, `artists`, `profile`) trigger `next/image` LCP lint warnings; unmigrated.
- Search results are unbounded by pagination beyond the initial `.limit(50)`.
