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
- **Open PR backlog (2026-07-31):** Many routine branches are open (artists/venues error-boundary,
  artist-page tests, pagenav focus trap, audioDb client, loading/title for /landing, reminder opt-in,
  and a large grooming PR backlog). Queue drift is the main risk: each open PR ticks its task inside
  its own branch, but until that branch merges the tick is invisible on `main`. Source-verify every
  Queue entry before implementing it (a file check beats trusting the checkbox).
- **`next/image` migration complete** — `artist/[name]/page.tsx` (#79), `artists/page.tsx` (#75),
  `profile/page.tsx` (#76), and `search/page.tsx` (#46) have all been migrated. The only remaining
  raw `<img>` on main is the OAuth avatar in `PageNav.tsx` (line 64, guarded by an eslint-disable
  comment) and the intentional fanart-probe `<img>` in `artist/[name]/page.tsx` (display:none,
  alt="", side-effect element — should remain raw). A Queue task targets the PageNav avatar.
- **Client-side data fetching drift:** `artist/[name]/page.tsx`, `search/page.tsx`, `artists/page.tsx`,
  and `venues/page.tsx` are all `'use client'` components fetching directly via the browser Supabase
  singleton. This contradicts the architectural principle ("DB access in server code / `src/lib/**`,
  not client components") and is the direct cause of the Cache-Control task being blocked (`revalidate`/
  `unstable_cache` are server-only). Migrating these pages to server components with a client shell is
  the long-term fix but is out of scope for any single routine PR.
- **Missing `src/app/artist/[name]/error.tsx`:** The artist route has `not-found.tsx` and `loading.tsx`
  but no `error.tsx` error boundary (confirmed absent on `main` as of 2026-07-31). Without it, any
  unhandled render-phase error in the artist route bubble up to the root `src/app/error.tsx`. A branch
  (`routine/artist-error-boundary-test`) targets this; verify before creating a duplicate task.
- **a11y gaps:** Several dynamic error messages and loading states lack `aria-live`/`role="alert"`
  attributes. The logo `div` in `PageNav.tsx` is keyboard-inaccessible. The sort buttons across
  `/artists`, `/venues`, and `/search` are missing `type="button"`. Multiple Queue tasks target these.
