@AGENTS.md

# LiveListen — Agent & Routine Workflow

This repo uses a role-based agent workflow (see `agents/`) and a daily cloud routine.
Project context lives in `docs/` (`PROJECT.md`, `ARCHITECTURE.md`, `TASKS.md`,
`DECISIONS.md`, `ROADMAP.md`).

## Agents (`agents/`)
- **architect** — designs, owns ARCHITECTURE/ROADMAP, writes tasks. Never writes prod code.
- **developer** — implements the top task on a `routine/<slug>` branch.
- **qa** — adds/runs tests, gates the PR.
- **security** — read-only veto: secrets, RLS, admin gating, deps.

## Routine workflow (what the daily routine does)
1. Read `docs/TASKS.md`; pick the **top unblocked** unchecked task (one per run).
2. Architect clarifies/decomposes if the task is vague.
3. Developer branches `routine/<task-slug>` off `main`, implements the smallest change.
4. QA adds/runs tests + typecheck + lint + build.
5. Security reviews (secrets, RLS, admin gating, deps).
6. Push the branch; open a PR titled `[routine] <task>` with summary + check output.
7. Tick the task `[x]` / move to `## Done` in `docs/TASKS.md` **within the PR**.
8. If blocked: leave it unchecked, add a `> blocked: <reason>` line, move on.

## Guardrails (non-negotiable)
- Never push to or merge into `main`. All work arrives as a reviewable PR.
- Never read/echo/edit/commit `.env*` or secrets — check key presence only.
- Read `node_modules/next/dist/docs/` before using Next.js APIs (breaking changes).
