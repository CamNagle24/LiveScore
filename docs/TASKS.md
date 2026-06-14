# LiveListen — Task Queue

This is the queue the **daily routine** reads. It takes the **top unblocked**
unchecked task, implements it on a `routine/<slug>` branch, and opens a PR.

Format: `- [ ] <title> — <acceptance criteria>`
- Top = highest priority. Add new work at the top to prioritize it.
- A task with a `> blocked: <reason>` line underneath is skipped until cleared.
- The routine ticks `[x]` inside its PR when done.

## Queue

- [ ] Add CI workflow `.github/workflows/test.yml` — runs `npm ci`, typecheck, lint, build on PRs to main; green on the default branch.
- [ ] Add a test harness (Vitest + React Testing Library) — config + one passing sample test + `npm test` script wired up.
- [ ] Cover admin gating in `src/middleware.ts` — tests proving non-`ADMIN_EMAILS` users are blocked from `/developer` and admins are allowed.
- [ ] Harden `/auth/callback` error handling — handle missing/invalid `code`, surface a friendly error UI instead of throwing; add a test.
- [ ] Add loading + error states to saved-performances flows — no unhandled rejections; user sees clear feedback on save/unsave failure.
- [ ] Per-page metadata + OpenGraph — `generateMetadata` on key routes (home, profile, performance detail) with title/description/og tags.

## Done
<!-- routine PRs move completed items here -->
