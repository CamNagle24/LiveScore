# LiveListen — Task Queue

This is the queue the **daily routine** reads. It takes the **top unblocked**
unchecked task, implements it on a `routine/<slug>` branch, and opens a PR.

Format: `- [ ] <title> — <acceptance criteria>`
- Top = highest priority. Add new work at the top to prioritize it.
- A task with a `> blocked: <reason>` line underneath is skipped until cleared.
- The routine ticks `[x]` inside its PR when done.

## Queue

- [ ] Cover admin gating in `src/proxy.ts` — tests proving non-`ADMIN_EMAILS` users are blocked from `/developer` and admins are allowed; mock `@supabase/ssr` and `next/server`.
- [ ] Harden `/auth/callback` error handling — handle missing/invalid `code`, surface a friendly error page (redirect to `/login?error=auth`) instead of throwing; add a test covering missing code, exchange failure, and success.
- [x] Add tests for the `useUser` auth store (`src/lib/useUser.ts`) — use `vi.mock` for `@/lib/supabase` and `next/navigation`; cover initial `getUser` load, `onAuthStateChange` updates, loading→resolved transition, and `useSignOut` redirect.
- [ ] Fix infinite spinner in artist page on Supabase error — `src/app/artist/[name]/page.tsx` doesn't catch a thrown Supabase query; add try/catch so `loading` is set to false and the user sees an error message instead of a stuck spinner.
- [ ] Add tests for `SuggestFooter` (`src/components/SuggestFooter.tsx`) — mock Supabase, cover: submit button disabled when artist field is empty; successful insert shows thank-you state; Supabase error surfaces error text; "Suggest another" resets the form.
- [ ] Add tests for `SaveButton` (`src/components/SaveButton.tsx`) — mock `useUser`, `useSavedIds`, `toggleSaved`; cover: unauthenticated click routes to `/login`; authenticated click calls `toggleSaved`; error shows tooltip; busy state blocks double-click.
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

## Done
<!-- routine PRs move completed items here -->
- [x] Add tests for the `useUser` auth store (`src/lib/useUser.ts`) — use `vi.mock` for `@/lib/supabase` and `next/navigation`; cover initial `getUser` load, `onAuthStateChange` updates, loading→resolved transition, and `useSignOut` redirect.
- [x] Add CI workflow `.github/workflows/test.yml` — runs `npm ci`, typecheck, lint, build on PRs to main; green on the default branch.
- [x] Per-page metadata + OpenGraph — `generateMetadata` on key routes (home, profile, performance detail) with title/description/og tags.
