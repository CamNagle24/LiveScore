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
- **Open PR backlog (2026-07-29):** Many task PRs remain open and unmerged. Queue drift continues
  to be the main risk: each open PR ticks its task inside its own branch, but until that branch merges
  the tick is invisible on `main`. Source-verify every Queue entry before implementing it (a file
  check beats trusting the checkbox). As of 2026-07-29 all existing Queue tasks either have an open
  PR or are blocked — grooming adds new net-fresh tasks.
- **Raw `<img>` in `PageNav.tsx`:** The OAuth avatar still uses a raw `<img>` with an eslint-disable
  comment (line 64). A Queue task targets this. All other `<img>` tags have been migrated.
- **Client-side data fetching drift:** `artist/[name]/page.tsx`, `search/page.tsx`, `artists/page.tsx`,
  and `venues/page.tsx` are all `'use client'` components fetching directly via the browser Supabase
  singleton. This contradicts the architectural principle ("DB access in server code / `src/lib/**`,
  not client components") and is the direct cause of the Cache-Control task being blocked (`revalidate`/
  `unstable_cache` are server-only). Migrating these pages to server components with a client shell is
  the long-term fix but is out of scope for any single routine PR.
- **Accessibility hardening in progress:** Multiple open PRs address ARIA labels, keyboard navigation,
  and focus traps. New grooming tasks (2026-07-29) add `aria-pressed` for sort buttons, `aria-hidden`
  on icon characters, WCAG 2.2.2 pause for the EventTicker, and keyboard-accessible logo link.
- **Duplicate `formatDate` helper:** The same utility is copy-pasted into three page files
  (`artist/[name]/page.tsx`, `search/page.tsx`, `profile/page.tsx`) — a Queue task extracts it.
- **Analytics funnel gap:** `VenueCard` click-through is not tracked; a Queue task closes this gap.
- **`NEXT_PUBLIC_SITE_URL` inconsistency:** `robots.ts` and `sitemap.ts` fall back to `""` while
  `layout.tsx` falls back to `"https://livescore.app"` — inconsistency causes empty-URL sitemap
  in environments where the var is unset; a Queue task standardizes the fallback.
