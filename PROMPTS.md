# LiveListen — Phone Prompts

Copy/paste these into Claude on claude.ai (web/phone) for this repo, or trigger the
routine directly. The daily routine runs automatically; these let you steer it.

## Add / prioritize work
- `Add to docs/TASKS.md as the TOP priority: <one-line task + acceptance criteria>. Commit only that change to main, then stop.`
- `Re-prioritize docs/TASKS.md: move "<task title>" to the top. Commit only that change, then stop.`

## Run work now
- `Run the routine workflow now: take the top unblocked task in docs/TASKS.md, implement it on a routine/<slug> branch, run checks, open a [routine] PR. Do not touch main.`

## Review
- `Summarize all open [routine] PRs in this repo and what each changes. List any > blocked: tasks in docs/TASKS.md.`
- `For PR #<n>: review the diff for correctness and security, then tell me if it's safe to merge.`

## Unblock
- `Task "<title>" in docs/TASKS.md is blocked because <reason>. Here's the answer: <...>. Remove the blocked note and run it.`
