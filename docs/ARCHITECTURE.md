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
- **Open PR backlog (2026-07-19):** Large PR backlog (30+ open routine branches). Queue drift continues
  to be the main risk: each open PR ticks its task inside its own branch, but until that branch merges
  the tick is invisible on `main`. Source-verify every Queue entry before implementing it (a file check
  beats trusting the checkbox).
- **Duplicated utility code:** `formatDate(d: string | null): string` is copy-pasted identically in
  `search/page.tsx`, `artist/[name]/page.tsx`, and `profile/page.tsx`. A task in the Queue extracts it
  to `src/lib/formatDate.ts`. Similarly, `interface Performance`/`WatchSource` are duplicated locally in
  `profile/page.tsx` despite existing in `src/types/performance.ts`.
- **Client-side data fetching drift:** `artist/[name]/page.tsx`, `search/page.tsx`, `artists/page.tsx`,
  and `venues/page.tsx` are all `'use client'` components fetching directly via the browser Supabase
  singleton. This contradicts the architectural principle ("DB access in server code / `src/lib/**`,
  not client components") and is the direct cause of the Cache-Control task being blocked (`revalidate`/
  `unstable_cache` are server-only). Migrating these pages to server components with a client shell is
  the long-term fix but is out of scope for any single routine PR.
- **Missing HSTS header:** `next.config.ts` ships CSP, `X-Content-Type-Options`, `X-Frame-Options`,
  and `Referrer-Policy` (added in #67) but not `Strict-Transport-Security`. A Queue task adds it.
- **Analytics gaps:** `VenueCard` fires no analytics event on click, unlike `ArtistCard` which calls
  `track('artist_card_click', ...)`. A Queue task adds `venue_card_click` tracking.
- **Untested layout metadata:** `/artists`, `/venues`, `/search`, `/profile`, and `/landing` layout
  files all export `metadata` objects with zero test coverage. Queue tasks add minimal layout tests.
