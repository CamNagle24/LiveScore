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
- **Open PR backlog (2026-08-14):** Large accumulation of open routine PRs. Queue drift is the main
  risk: each open PR ticks its task inside its own branch, but until that branch merges the tick is
  invisible on `main`. Source-verify every Queue entry before implementing it (a file check beats
  trusting the checkbox). Many Queue tasks on `main` already have a remote `routine/*` branch — skip
  any task whose slug already exists as a remote branch.
- **`src/app/artist/[name]/error.tsx` does not exist on `main`:** The Queue task "Add test coverage
  for `src/app/artist/[name]/error.tsx`" has a false premise — the file was never created. A new task
  "Create `src/app/artist/[name]/error.tsx` and add test coverage" supersedes it.
- **Client-side data fetching drift:** `artist/[name]/page.tsx`, `search/page.tsx`, `artists/page.tsx`,
  and `venues/page.tsx` are all `'use client'` components fetching directly via the browser Supabase
  singleton. This contradicts the architectural principle ("DB access in server code / `src/lib/**`,
  not client components") and is the direct cause of the Cache-Control task being blocked (`revalidate`/
  `unstable_cache` are server-only). Migrating these pages to server components with a client shell is
  the long-term fix but is out of scope for any single routine PR.
- **Shipped (no longer gaps):** Raw `<img>` tags in `artist/[name]/page.tsx`, `artists/page.tsx`, and
  `profile/page.tsx` were all migrated to `next/image` in prior PRs. `X-Content-Type-Options`,
  `X-Frame-Options`, and `Referrer-Policy` headers ship in `next.config.ts` (PR #67). `poweredByHeader:
  false` shipped in #50. Skip-to-main link shipped in #51.
