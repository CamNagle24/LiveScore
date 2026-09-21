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
- **Queue drift:** each routine PR ticks its task inside its own branch; until that branch merges
  the tick is invisible on `main`. Source-verify every Queue entry before implementing it (a file
  check beats trusting the checkbox). As of 2026-09-21 all 16 active Queue items have open routine
  branches — none are eligible for a new routine implementation until a branch is merged or closed.
- **Client-side data fetching drift:** `artist/[name]/page.tsx`, `search/page.tsx`, `artists/page.tsx`,
  and `venues/page.tsx` are all `'use client'` components fetching directly via the browser Supabase
  singleton. This contradicts the architectural principle ("DB access in server code / `src/lib/**`,
  not client components") and is the direct cause of the Cache-Control task being blocked (`revalidate`/
  `unstable_cache` are server-only). Migrating these pages to server components with a client shell is
  the long-term fix but is out of scope for any single routine PR.
- **Incomplete CSP:** `next.config.ts` sets `script-src`, `img-src`, and `connect-src` but omits
  `style-src` and `font-src`, leaving those directives unrestricted. A task to add `style-src 'self'
  'unsafe-inline'` and `font-src 'self' https://fonts.gstatic.com` is in the Queue.
- **In-memory rate limiter unbounded growth:** `src/lib/rateLimit.ts` accumulates one `Bucket` entry
  per distinct IP seen and never prunes them; a task to add a `MAX_BUCKETS` purge guard is in the Queue.
- **Accessibility gaps:** `PageNav.tsx`'s logo `<div>` is not keyboard-navigable and the account-menu
  toggle button lacks `aria-expanded`; tasks for both are in the Queue.
