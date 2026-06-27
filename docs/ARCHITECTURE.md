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
- **PR backlog is the actual bottleneck, not task supply.** As of this grooming pass, 16 `[routine]`
  PRs (#32–#47) are open and unmerged, the oldest since 2026-06-18 — every item already in the
  Queue has either an open PR/branch against it or (for 3 entries) was already shipped on `main`
  without the Queue being ticked off. The work loop found **zero eligible tasks** this run and
  also found zero last run (#47). Grooming alone can't fix this — the bottleneck is review/merge
  throughput. Recommend triaging and merging (or closing) the open PRs before the next run, and
  reconciling the duplicate grooming PRs (#42, #47, and this one) into `docs/TASKS.md` once one lands.
- No test coverage for `src/lib/supabase.ts`'s lazy Proxy-based singleton client.
- No "skip to main content" link or `<main>` landmark in `RootLayout` — `<body>` renders `children`
  directly.
- `next.config.ts` doesn't set `poweredByHeader: false`; responses leak `X-Powered-By: Next.js`.
- `robots.ts` doesn't disallow `/api/`.
- Raw `<img>` tags remain in `artist/[name]`, `artists`, and `profile` (search page's is mid-PR in #46).
