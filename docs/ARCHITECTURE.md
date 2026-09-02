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
- **Open PR backlog (2026-09-02):** Large number of open routine task and grooming PRs pending owner
  review. Queue drift continues to be the main risk: each open PR ticks its task inside its own
  branch, but until that branch merges the tick is invisible on `main`. Source-verify every Queue
  entry before implementing it (a file check beats trusting the checkbox).
- **Raw `<img>` in `PageNav.tsx` avatar:** The avatar `<img>` in the account button uses a raw `<img>`
  tag (with an ESLint disable comment) rather than `next/image`; `lh3.googleusercontent.com` is already
  in `remotePatterns` so this is a simple swap.
- **Client-side data fetching drift:** `artist/[name]/page.tsx`, `search/page.tsx`, `artists/page.tsx`,
  and `venues/page.tsx` are all `'use client'` components fetching directly via the browser Supabase
  singleton. This contradicts the architectural principle ("DB access in server code / `src/lib/**`,
  not client components") and is the direct cause of the Cache-Control task being blocked (`revalidate`/
  `unstable_cache` are server-only). Migrating these pages to server components with a client shell is
  the long-term fix but is out of scope for any single routine PR.
- **Security headers:** `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and CSP are
  all now present in `next.config.ts`. `Permissions-Policy` is still absent (task in Queue).
  `X-Robots-Tag` response headers for `/profile` and `/developer` are also absent (only `robots.ts`
  disallow is set).
- **Duplicate `formatDate` helper:** `formatDate(d: string | null)` is copy-pasted verbatim across
  `search/page.tsx`, `artist/[name]/page.tsx`, and `profile/page.tsx`. Extract to `src/lib/formatDate.ts`.
- **Logo link keyboard gap:** The LIVESCORE logo `div` in `PageNav.tsx` has `onClick` but no
  `role="link"`, `tabIndex`, or `onKeyDown` — keyboard-only users cannot activate it.
