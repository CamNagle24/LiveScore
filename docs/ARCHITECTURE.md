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
- **PR backlog cleared.** The 16 `[routine]` PRs (#32–#47) noted as a bottleneck in the prior
  grooming pass are gone — `main` is caught up through #48. This run found 14 Queue entries were
  already shipped on `main` under those PR numbers without the Queue being ticked off (now
  reconciled into `## Done` below) and shipped the 4 entries that were still genuinely open as
  PRs #49–#52. Watch for the same staleness pattern recurring: when a task PR's `docs/TASKS.md`
  edit doesn't make it into `main` (e.g. a grooming PR merges first and re-adds the item, or a
  task PR is closed without merging), the Queue silently drifts from reality.
- Raw `<img>` tags remain in `artist/[name]`, `artists`, and `profile` (search page's was migrated
  in #46).
