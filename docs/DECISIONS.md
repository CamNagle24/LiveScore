# LiveListen — Decisions (ADR log)

Append-only. Newest first. One short entry per meaningful decision.

## 2026-07-20 — Work loop yielded 0 eligible tasks; all 18 Queue items blocked/in-flight
This run found all 18 unchecked Queue items either already have an open `[routine]` PR (16 items)
or are architecturally blocked (2 items). No new implementation work could proceed without
duplicating in-flight PRs. The grooming pass added 13 new independently-shippable tasks covering:
CI coverage threshold hardening, rate-limiter memory-cap, `<Image>` `sizes` prop, accessibility
improvements (aria-pressed, role="search", aria-label group), loading.tsx smoke tests, OG type
metadata, formatDate extraction, layout metadata tests, URL sync for search, and a doc-only
ARCHITECTURE.md update. ARCHITECTURE.md's known-gaps section was updated to remove two stale items
(img-migration resolved in #54–#55; security headers resolved in #67) and add a note about the
in-memory rate-limiter's process-local scope.
**Why:** better to accurately surface the work-in-flight state and replenish the backlog with
concrete new tasks than to force a duplicate implementation through existing in-flight PRs.

## 2026-07-01 — Work loop yielded 0 eligible tasks; all 15 Queue items blocked/in-flight/done
This run found: 8 items with open PRs (#54–#61) — not eligible. 2 items already shipped but not
ticked off (`artist/[name]/not-found.tsx` in #11; `/search` empty-state in original scaffold).
2 items architecturally blocked (Cache-Control requires server-side data layer; `sitemap.ts`
`lastModified` test requires the field to exist first). No eligible implementation tasks remain.
The grooming PR (this one) reconciles those stale entries, adds `> open:` notes for in-flight
PRs to prevent future re-implementation, and adds 10 new independently-shippable tasks to
replenish the backlog. **Why:** better to record the 0-task state cleanly than to force an
ineligible task through and produce a broken PR.

## 2026-06-28 — Second reconciliation pass; flag client-side Supabase fetching as a stated-convention violation
Found 6 more stale Queue entries (unchecked but already shipped): 4 from the #49–#52 batch that
merged since the 2026-06-27 pass, 1 from #11 (over a week earlier, never previously reconciled),
and 1 (`/search` empty-state message) that predates the routine workflow entirely — present since
the original scaffold commit and never an accurate Queue entry. All 6 moved to `## Done` with
shipping/provenance notes, verified against source (not checkbox state) per the standing rule from
the prior pass. Two further Queue items were left unchecked but marked `> blocked:` because their
premise is factually wrong: the Cache-Control task assumes a server-side fetch path that doesn't
exist, and the sitemap `lastModified` test task assumes a field that has never been added to
`sitemap.ts`. Separately, confirmed and documented an architectural gap: `docs/ARCHITECTURE.md`
states DB access belongs in server code, but four pages (`artist/[name]`, `search`, `artists`,
`venues`) are `'use client'` and call the Supabase browser client directly — this is also the root
cause of the Cache-Control task being blocked. Added a small, single-page-scoped Queue task
(migrate `/search` first) rather than one task to migrate all four at once.
**Why:** small, independently-shippable slices keep the daily routine able to make real progress
each run; a single "fix the architecture" task would either get skipped indefinitely (too large
for "smallest change") or done sloppily under time pressure. Verifying claims against source before
writing them down (rather than trusting either checkbox state or the original task's stated
premise) is now the standard for every grooming pass, not just a one-time cleanup.

## 2026-06-27 — Reconcile stale Queue entries by verifying source, not by trusting checkboxes
This run found 14 of 18 Queue items already implemented on `main` under PR numbers #32–#46,
despite being unchecked in `docs/TASKS.md`. Rather than re-implementing (no-op PRs) or guessing,
each item was verified against the actual source file before being moved to `## Done` with the
shipping PR number. The 4 remaining genuinely-open items were implemented as their own PRs
(#49–#52); the grooming pass left those unchecked in the Queue (with a note pointing at the open
PR) rather than ticking them here, so the eventual merge of each task PR is still the place that
flips its checkbox — avoids two PRs racing to edit the same line.
**Why:** a `[ ]`/`[x]` checkbox is not authoritative when a prior task PR's `docs/TASKS.md` edit
may not have landed on `main` (e.g. it was closed instead of merged, or a grooming PR merged first
and re-added the line). Source code is the ground truth; the Queue is a hint about where to look.

## 2026-06-14 — Adopt agent + routine workflow
Added `docs/` (PROJECT/ARCHITECTURE/TASKS/DECISIONS/ROADMAP) and role-based
`agents/` (architect/developer/qa/security). A daily cloud routine pulls the top
task from `docs/TASKS.md`, implements it on a `routine/<slug>` branch, runs checks,
and opens a PR. Routines never push to `main`, never merge, never touch secrets.
**Why:** enable safe autonomous progress while the owner is away; all output arrives
as reviewable PRs.
