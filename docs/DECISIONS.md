# LiveListen — Decisions (ADR log)

Append-only. Newest first. One short entry per meaningful decision.

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
