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
- **Stale-Queue pattern recurred; reconciled again.** The 2026-06-27 grooming pass's note about
  PRs #49–#52 is now resolved (those merged and are reconciled into `## Done`). This run
  (2026-06-28) found 6 *more* stale Queue entries whose checkboxes never reflected already-shipped
  work — and they weren't all the same vintage: 4 were the immediately-preceding #49–#52 batch
  (expected, since those PRs were "open" as of the last pass and have since merged), 1 shipped in
  #11 over a week earlier and was simply never reconciled in any prior pass, and 1 (the `/search`
  empty-state message) predates the entire task-queue/routine workflow — it's been in the codebase
  since the original scaffold commit and was never accurate to begin with. The pattern isn't just
  "a grooming PR's edit gets clobbered by a same-day task PR merging after it" — entries can sit
  stale indefinitely until someone actually checks source. Treat every Queue checkbox as a hint,
  not a fact, on every pass, not just for the immediately-prior batch of PR numbers.
- Raw `<img>` tags remain in `artist/[name]`, `artists`, and `profile` (search page's was migrated
  in #46); a Queue entry now exists to migrate `profile` first as the smallest next slice.
- **Client components fetch Supabase directly, violating the stated data-layer convention.** This
  doc's own Conventions section says "Keep DB access in server code / `src/lib/**`, not client
  components," but `src/app/artist/[name]/page.tsx`, `src/app/search/page.tsx`,
  `src/app/artists/page.tsx`, and `src/app/venues/page.tsx` are all `'use client'` and call the
  Supabase JS client (`@/lib/supabase`, the browser singleton) directly in the component body —
  none of them go through a server component or route handler. This is long-standing drift, not a
  regression from recent PRs. It also blocks straightforward fixes elsewhere: the Cache-Control
  Queue entry is blocked specifically because `revalidate`/`fetch` cache hints and `unstable_cache`
  are server-only mechanisms that don't apply to a browser-side fetch path. A Queue entry now
  scopes a first slice (migrate `/search` only) rather than one big "migrate everything" task —
  `artists`, `venues`, and `artist/[name]` are left as separate follow-ups once that pattern is
  proven out.
