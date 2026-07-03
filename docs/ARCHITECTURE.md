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
- **Recurring staleness pattern.** PRs #49–#52 merged onto `main` but their `docs/TASKS.md` ticks
  never landed (conflicted with multiple open groom PRs). As of 2026-07-03 the 2026-07-03 groom PR
  reconciled all 6 stale Queue entries (PRs #49–#52 plus two scaffold-era items). Watch for the
  same pattern: when a groom PR is open and task PRs merge in behind it, the Queue drifts from
  reality until the groom PR itself merges.
- **5 open routine PRs** as of 2026-07-03: canonical link (#56), rate limiting (#57), vitest
  coverage (#58), `aria-current` in PageNav (#60), root `not-found.tsx` (#61). Plus 3 open groom
  PRs (#59, #62, #63) that will conflict on merge — reviewer should merge one, then resolve
  conflicts in the others.
- **Raw `<img>` tags** remain in `src/app/artist/[name]/page.tsx` (3 tags),
  `src/app/profile/page.tsx` (4 tags), `src/app/artists/page.tsx` (1 tag), and
  `src/components/PageNav.tsx` (1 tag). Tasks to migrate each are queued. (`search/page.tsx`
  was migrated in #46.)
- **Missing security headers.** `next.config.ts` only sets `Content-Security-Policy`. Tasks to add
  `X-Content-Type-Options`, `X-Frame-Options`, and `Referrer-Policy` are queued.
- **Client-side data-fetching drift.** `artist/[name]/page.tsx`, `search/page.tsx`,
  `artists/page.tsx`, and `venues/page.tsx` are all `'use client'` components calling the browser
  Supabase singleton directly — in violation of the "DB access in server code / `src/lib/**`"
  convention. This is long-standing drift (not a recent regression) and is the root cause of the
  Cache-Control task being blocked. No queue task yet for the full migration.
- **Silent Supabase error in `venues/page.tsx`.** `load()` only destructures `data` — errors are
  swallowed. Task queued; `artists/page.tsx` already has the correct `{ data, error }` pattern.
