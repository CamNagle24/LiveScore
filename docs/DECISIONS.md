# LiveListen — Decisions (ADR log)

Append-only. Newest first. One short entry per meaningful decision.

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
