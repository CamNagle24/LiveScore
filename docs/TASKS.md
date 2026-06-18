# LiveListen — Task Queue

This is the queue the **daily routine** reads. It takes the **top unblocked**
unchecked task, implements it on a `routine/<slug>` branch, and opens a PR.

Format: `- [ ] <title> — <acceptance criteria>`
- Top = highest priority. Add new work at the top to prioritize it.
- A task with a `> blocked: <reason>` line underneath is skipped until cleared.
- The routine ticks `[x]` inside its PR when done.

## Queue

- [ ] Harden `/auth/callback` error handling — handle missing/invalid `code`, surface a friendly error page (redirect to `/login?error=auth`) instead of throwing; add a test covering missing code, exchange failure, and success.
- [ ] Add tests for the `useUser` auth store (`src/lib/useUser.ts`) — use `vi.mock` for `@/lib/supabase` and `next/navigation`; cover initial `getUser` load, `onAuthStateChange` updates, loading→resolved transition, and `useSignOut` redirect.
- [ ] Fix infinite spinner in artist page on Supabase error — `src/app/artist/[name]/page.tsx` doesn't catch a thrown Supabase query; add try/catch so `loading` is set to false and the user sees an error message instead of a stuck spinner.
- [ ] Add tests for `SuggestFooter` (`src/components/SuggestFooter.tsx`) — mock Supabase, cover: submit button disabled when artist field is empty; successful insert shows thank-you state; Supabase error surfaces error text; "Suggest another" resets the form.
- [ ] Add tests for `SaveButton` (`src/components/SaveButton.tsx`) — mock `useUser`, `useSavedIds`, `toggleSaved`; cover: unauthenticated click routes to `/login`; authenticated click calls `toggleSaved`; error shows tooltip; busy state blocks double-click.
- [ ] Add unit tests for `savedStore` (`src/lib/savedStore.ts`) — no test coverage exists; mock `@/lib/supabase`; cover: `ensureSavedLoaded` populates `savedIds` and deduplicates; duplicate call before first resolves returns the same promise; `toggleSaved` optimistically updates then reverts and rethrows on Supabase error; `resetSaved` clears all state and allows a fresh load.
- [ ] Fix silent Supabase error in `src/app/search/page.tsx` — `fetchPerformances` has no try/catch; a thrown error leaves `loading:false` with empty results and zero user feedback; add try/catch and a `searchError` state that shows an inline error banner beneath the search box.
- [ ] Extract shared types to `src/types/performance.ts` — `src/app/artist/[name]/page.tsx` and `src/app/search/page.tsx` both define identical `Performance` and `WatchSource` interfaces; move them to a shared module and import from there to prevent type drift.
- [ ] Add `global-error.tsx` for root layout errors — `src/app/error.tsx` catches errors in nested routes but not in the root layout itself; add `src/app/global-error.tsx` as a Client Component with `<html>` and `<body>` tags and the `unstable_retry` prop per Next 16 docs.
- [ ] Add AbortController cancellation to search fetch in `src/app/search/page.tsx` — the 400ms debounce prevents excess calls but does not cancel in-flight requests; a slow response can overwrite a newer one; pass `AbortSignal` to the Supabase query and discard stale results.
- [ ] Add `aria-label` to `SuggestFooter` inputs — the three inputs rely solely on placeholder text which disappears on focus; add `aria-label` to each field and `aria-required="true"` on the artist name field so screen readers announce field purpose when focused.
- [ ] Add `robots.ts` and `sitemap.ts` (App Router file conventions) — sitemap covering static routes and dynamic `/artist/[name]` pages fetched from Supabase; `noindex` on `/profile` and `/developer`.
- [ ] Add `loading.tsx` skeletons for `/search`, `/artists`, `/venues`, and `/profile` — show a skeleton/spinner while Supabase data loads instead of a blank page.
- [ ] Add `src/app/artist/[name]/loading.tsx` skeleton — a hero placeholder + grid of card skeletons that streams before the client component hydrates, replacing the spinner that currently only appears post-hydration.
- [ ] Harden `SuggestFooter` submission (`src/components/SuggestFooter.tsx`) — validate non-empty artist name, max field lengths (artist ≤ 100 chars, event ≤ 150 chars, link ≤ 500 chars), and basic URL format for `link`; prevent duplicate rapid submissions with a `submitting` guard.
- [ ] Add input validation + tests for `/api/artists/search` (`src/app/api/artists/search/route.ts`) — reject `q` longer than 100 chars or containing only whitespace; add `AbortSignal.timeout(5000)` to the upstream fetch; add tests mocking the AudioDB response (success, empty, non-OK, network error, timeout).
- [ ] Add `global-error.tsx` for root layout errors — `error.tsx` does not catch errors thrown in the root layout; add `src/app/global-error.tsx` (Client Component with `<html>` and `<body>` tags, `unstable_retry` prop) per Next 16 docs.
- [ ] Add `Content-Security-Policy` headers in `next.config.ts` — restrict `script-src`, `img-src` (allow `img.youtube.com`, `*.supabase.co`, `raw.githubusercontent.com`), and `connect-src` (Supabase URL, AudioDB) to reduce XSS blast radius.
- [ ] Validate required env vars at startup — add `src/lib/env.ts` that checks `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are non-empty at module load, throwing a descriptive error in dev/build rather than a silent auth failure.
- [ ] Add ARIA labels to performance cards — `src/app/search/page.tsx` card wrappers and play-button overlays lack `aria-label`; add `aria-label="Watch {eventName} by {artistName}"` and `role="button"` or `<button>` wrappers for keyboard + screen reader users.
- [ ] Paginate search results — `src/app/search/page.tsx` fetches all matching performances with no limit; add a page size of 24 and a "Load more" button that appends the next page, keeping the Supabase query bounded.
- [ ] Unit tests for `savedStore` (`src/lib/savedStore.ts`) — mock `@/lib/supabase`; cover `toggleSaved` optimistic update and rollback on error, `ensureSavedLoaded` de-duplication (second call with same userId is a no-op), `resetSaved` clearing state and `loadedForUser`; no live network calls.
- [ ] Tests for `developer/layout.tsx` — mock `@/lib/supabase/server`; cover unauthenticated user redirected to `/login?next=/developer`, non-admin authenticated user redirected to `/landing`, admin user passes through and renders `children`.
- [ ] Fix silent Supabase error in `search/page.tsx` (`fetchPerformances`) — currently `data` is silently `null` on error and the page shows an empty grid with no feedback; add try/catch, set an `error` state, and show a user-facing message with a "Try again" retry button that re-runs the last query.
- [ ] Extract shared `Performance` and `WatchSource` types to `src/lib/types.ts` — `src/app/search/page.tsx` and `src/app/artist/[name]/page.tsx` each define identical `interface WatchSource` and `interface Performance`; extract to a shared module and import from there to prevent type drift.
- [ ] Add AbortController to `fetchPerformances` in `search/page.tsx` — the debounce delays the next call but does not cancel in-flight requests; a slow earlier response can arrive after a fast later one and overwrite results; cancel the previous fetch via `AbortController` in the debounce cleanup.
- [ ] Add ARIA labels to `SuggestFooter` inputs (`src/components/SuggestFooter.tsx`) — all three inputs rely solely on `placeholder` text which disappears on focus; add `aria-label="Artist name"`, `aria-label="Event or venue (optional)"`, and `aria-label="Link to video (optional)"` attributes.
- [ ] Add `robots: noindex` metadata to `/profile` and `/developer` layouts — `robots.txt` blocks crawlers but some indexers ignore it; add `export const metadata: Metadata = { robots: { index: false, follow: false } }` to `src/app/profile/layout.tsx` and `src/app/developer/layout.tsx`.
- [ ] Fix venues page silent error and empty state (`src/app/venues/page.tsx`) — the Supabase fetch has no try/catch; a network error leaves `loading` stuck as true indefinitely; add try/catch, an `error` state with a "Try again" retry button, and a dedicated empty-state message when no venues are returned.
- [ ] Limit developer dashboard queries to 200 rows (`src/app/developer/page.tsx`) — all table fetches are unbounded; large tables will be slow or hit Supabase row limits; add `.limit(200)` to each query and display a "Showing up to 200 rows" notice.
- [ ] Add skip-to-content link in root layout — `src/app/layout.tsx` has no skip link; keyboard users must tab through the entire nav on every page; add a visually-hidden but focusable `<a href="#main-content">Skip to content</a>` as the first child of `<body>`, and add `id="main-content"` to the first `<main>` element in each page.

## Done
<!-- routine PRs move completed items here -->
- [x] Cover admin gating in `src/proxy.ts` — tests proving non-`ADMIN_EMAILS` users are blocked from `/developer` and admins are allowed; mock `@supabase/ssr` and `next/server`.
- [x] Add CI workflow `.github/workflows/test.yml` — runs `npm ci`, typecheck, lint, build on PRs to main; green on the default branch.
- [x] Per-page metadata + OpenGraph — `generateMetadata` on key routes (home, profile, performance detail) with title/description/og tags.
- [x] Add tests for `src/app/developer/layout.tsx` — duplicates admin check from `proxy.ts` (defence in depth) but is untested; mock `@/lib/supabase/server` and `next/navigation`; cover: unauthenticated → redirect `/login?next=/developer`; non-admin → redirect `/landing`; admin → renders children.
