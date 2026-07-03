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
- **PR backlog persists.** Eight open `[routine]` PRs (#54–#61) are unmerged against `main`.
  This run found 2 more Queue entries already shipped (artist `not-found.tsx` in #11, empty-state
  in the original scaffold) but unchecked — reconciled into `## Done`. The staleness pattern
  observed in the previous grooming pass continues: task PRs whose `docs/TASKS.md` edit doesn't
  merge leave the Queue drifting from reality. Verify all items against source before implementing.
- Raw `<img>` tags remain in `artist/[name]/page.tsx`, `artists/page.tsx`, and `profile/page.tsx`
  (search page migrated in #46); `next.config.ts` `remotePatterns` needs `www.theaudiodb.com`
  and `lh3.googleusercontent.com` added before those migrations can land.
- Security headers incomplete: `next.config.ts` sets CSP and `poweredByHeader: false` but lacks
  `X-Content-Type-Options`, `X-Frame-Options`, and `Referrer-Policy`.
- Client-side data fetching drift: `artist/[name]/page.tsx`, `search/page.tsx`, `artists/page.tsx`,
  and `venues/page.tsx` are all `'use client'` and call the browser Supabase singleton directly,
  contradicting the architecture principle of keeping DB access in server code / `src/lib/**`.
  This blocks caching improvements until the pages are migrated to a server-component data layer.
