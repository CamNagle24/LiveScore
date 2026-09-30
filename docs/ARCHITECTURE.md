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
- **Open PR backlog (2026-09-30 snapshot):** Many task PRs open across `routine/*` branches — queue
  drift continues to be the main risk: each open PR ticks its task inside its own branch, but until
  that branch merges the tick is invisible on `main`. Source-verify every Queue entry before
  implementing it (a file check beats trusting the checkbox).
- **`artist/[name]/error.tsx` missing:** `src/app/artist/[name]/` has `not-found.tsx` and `loading.tsx`
  but no `error.tsx`; an existing queue task tries to add tests for it, but the file itself must be
  added first. Added a preceding task to create the boundary.
- **Client-side data fetching drift:** `artist/[name]/page.tsx`, `search/page.tsx`, `artists/page.tsx`,
  and `venues/page.tsx` are all `'use client'` components fetching directly via the browser Supabase
  singleton. This contradicts the architectural principle ("DB access in server code / `src/lib/**`,
  not client components") and is the direct cause of the Cache-Control task being blocked (`revalidate`/
  `unstable_cache` are server-only). Migrating these pages to server components with a client shell is
  the long-term fix but is out of scope for any single routine PR.
- **Analytics coverage gaps:** `SuggestFooter` and `VenueCard` do not call `track()` on user
  interaction, leaving gaps in the discovery funnel metrics added in earlier PRs. Tasks queued to add
  these calls.
- **Image optimisation gaps:** `ArtistCard` in `artists/page.tsx` uses `fill` without a `sizes` prop
  (inflating bandwidth on small viewports); the first `EventCard` image in `landing/page.tsx` lacks
  `priority` (potential LCP regression). Both are queued.
- **Layout metadata tests:** `artists/`, `venues/`, `profile/`, and `search/` layouts each export
  `metadata` with no test coverage. Tasks queued.
