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
- **Open PR backlog (2026-07-20):** 16+ task PRs open (accessibility, test coverage, OG metadata,
  audioDb client, PageNav focus trap, reminder opt-in, and grooming PRs through 2026-07-19). Queue
  drift continues to be the main risk: each open PR ticks its task inside its own branch, but until
  that branch merges the tick is invisible on `main`. Source-verify every Queue entry before
  implementing it (a file check beats trusting the checkbox).
- **Client-side data fetching drift:** `artist/[name]/page.tsx`, `search/page.tsx`, `artists/page.tsx`,
  and `venues/page.tsx` are all `'use client'` components fetching directly via the browser Supabase
  singleton. This contradicts the architectural principle ("DB access in server code / `src/lib/**`,
  not client components") and is the direct cause of the Cache-Control task being blocked (`revalidate`/
  `unstable_cache` are server-only). Migrating these pages to server components with a client shell is
  the long-term fix but is out of scope for any single routine PR. The `/search` migration task is in
  the Queue but marked blocked pending an architect design for the RSC/client split.
- **In-memory rate limiter is process-local:** `src/lib/rateLimit.ts` uses a process-local Map, so
  on serverless or multi-instance deployments each cold start gets its own bucket. This is intentional
  (no Redis dependency) but means the limit is per-instance, not globally consistent. A task in the
  Queue adds a map-size cap to prevent unbounded growth under IP diversity.
