# LiveListen — Task Queue

This is the queue the **daily routine** reads. It takes the **top unblocked**
unchecked task, implements it on a `routine/<slug>` branch, and opens a PR.

Format: `- [ ] <title> — <acceptance criteria>`
- Top = highest priority. Add new work at the top to prioritize it.
- A task with a `> blocked: <reason>` line underneath is skipped until cleared.
- The routine ticks `[x]` inside its PR when done.

## Queue

- [ ] Add a test harness (Vitest + React Testing Library) — config + one passing sample test + `npm test` script wired up.
- [ ] Cover admin gating in `src/proxy.ts` (renamed from `src/middleware.ts` under Next 16's middleware→proxy migration) — tests proving non-`ADMIN_EMAILS` users are blocked from `/developer` and admins are allowed.
> blocked: needs the Vitest harness (PR #4, not yet merged) to add the required tests.
- [ ] Harden `/auth/callback` error handling — handle missing/invalid `code`, surface a friendly error UI instead of throwing; add a test.
> blocked: needs the Vitest harness (PR #4, not yet merged) to add the required test.
- [ ] Add loading + error states to saved-performances flows — no unhandled rejections; user sees clear feedback on save/unsave failure.
- [ ] Per-page metadata + OpenGraph — `generateMetadata` on key routes (home, profile, performance detail) with title/description/og tags.
- [ ] Add tests for the `useUser` auth store (`src/lib/useUser.ts`) — mock the Supabase client, cover initial `getUser` load, `onAuthStateChange` updates, and `useSignOut`.
- [ ] Add a `not-found.tsx` for `src/app/artist/[name]/` — when an artist has no performances, show a friendly "not found" UI with a link back to search instead of an empty page.
- [ ] Add a root `error.tsx` — catch render/runtime errors with a friendly fallback UI and a "try again" action instead of the default error overlay.
- [ ] Add `robots.ts` and `sitemap.ts` (App Router file conventions) — sitemap covering static routes and dynamic `/artist/[name]` pages from Supabase, respecting `noindex` on `/profile` and `/developer`.
- [ ] Add `loading.tsx` skeletons for `/search`, `/artists`, `/venues`, and `/profile` — show a skeleton/spinner while Supabase data loads instead of a blank page.
- [ ] Debounce the search input in `src/app/search/page.tsx` — avoid firing a Supabase query on every keystroke; add a short debounce (e.g. 300ms) and cancel stale in-flight requests.
- [ ] Harden `SuggestFooter` submission (`src/components/SuggestFooter.tsx`) — validate non-empty artist name, max field lengths, and basic URL format for `link`; prevent duplicate rapid submissions.
- [ ] Add input validation + tests for `/api/artists/search` (`src/app/api/artists/search/route.ts`) — reject overly long/invalid `q`, add a timeout on the upstream fetch, and add tests mocking the AudioDB response (success, empty, non-OK, network error).

## Done
<!-- routine PRs move completed items here -->
- [x] Add CI workflow `.github/workflows/test.yml` — runs `npm ci`, typecheck, lint, build on PRs to main; green on the default branch.
- [x] Per-page metadata + OpenGraph — `generateMetadata` on key routes (home, profile, performance detail) with title/description/og tags.
- [x] Add unit tests for `src/lib/youtube.ts` (`getYouTubeThumbnail`, `getBestSource`) — cover YouTube/youtu.be URL variants, non-YouTube URLs, malformed/empty/null inputs, and verified-vs-unverified source ranking.
