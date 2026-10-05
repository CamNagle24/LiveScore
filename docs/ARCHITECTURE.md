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
- **Queue drift:** each open PR ticks its task inside its own branch, but until that branch merges
  the tick is invisible on `main`. Source-verify every Queue entry before implementing it (a file
  check beats trusting the checkbox). As of 2026-10-05 all 16 non-blocked Queue tasks have
  `routine/*` branches already open; the work loop should skip them and focus on newly groomed items.
- **Client-side data fetching drift:** `artist/[name]/page.tsx`, `search/page.tsx`, `artists/page.tsx`,
  and `venues/page.tsx` are all `'use client'` components fetching directly via the browser Supabase
  singleton. This contradicts the architectural principle ("DB access in server code / `src/lib/**`,
  not client components") and is the direct cause of the Cache-Control task being blocked (`revalidate`/
  `unstable_cache` are server-only). Migrating these pages to server components with a client shell is
  the long-term fix but is out of scope for any single routine PR.
- **Incomplete CSP:** `next.config.ts` ships `script-src`, `img-src`, and `connect-src` but is
  missing `frame-src`, `object-src`, `font-src`, and `style-src`. Two tasks in the Queue add these.
- **`NEXT_PUBLIC_SITE_URL` unvalidated:** used in `artist/[name]/layout.tsx` and `sitemap.ts` but
  not checked by `src/lib/env.ts` at startup; a missing value silently generates empty canonical URLs.
- **Shipped (no longer gaps):** raw `<img>` tags in all four pages migrated to `next/image` (#46,
  #47, #48, #55); `X-Content-Type-Options`, `X-Frame-Options`, and `Referrer-Policy` headers added
  in PR #67; `poweredByHeader: false` set in #50; rate limiting on `/api/artists/search` added.
