# Supabase

SQL migrations for LiveScore. Run them in the **Supabase SQL editor**
(Dashboard → SQL Editor → New query), or via the Supabase CLI.

## Migrations

| File | What it creates |
|------|-----------------|
| `saved.sql` | `saved_performances` table + row-level security for account-bound bookmarks |
| `suggestions.sql` | `suggestions` table + RLS for visitor-submitted performance ideas (the site footer) |

Run each once per environment (they use `create table if not exists`, so
re-running is safe).

## `saved_performances`

Per-user bookmarks of performances.

```
user_id        uuid  → auth.users(id)        on delete cascade
performance_id text  → performances(id)      on delete cascade
created_at     timestamptz default now()
primary key (user_id, performance_id)
```

- **Composite primary key** prevents a user saving the same performance twice.
- **Cascade deletes** drop a user's saved rows when the user or the performance
  is removed.

### ⚠️ `performance_id` is `text`, not a number

`performances.id` holds **string** keys (e.g. `tmdb-<id>-<ts>`, `manual-<ts>`),
so `performance_id` and its foreign key must be `text`. A `bigint` column would
fail to create the foreign key against a text `performances.id`. If you ever
add another table referencing `performances(id)`, use `text`.

> The `performances` table itself is created by the external ingestion
> pipeline, not by these migrations.

## `suggestions`

Visitor-submitted performance ideas from the footer form (artist + optional
event/link). Distinct from the pipeline's `streaming_suggestions` table
reviewed on `/developer`.

```
id           bigint  generated identity, primary key
artist_name  text    not null
event_name   text
link         text
created_at   timestamptz default now()
```

RLS allows **insert only**, for anonymous and signed-in visitors, since the
footer appears on public pages. There is no select/update/delete policy, so the
anon key cannot read or alter submissions — review them in the dashboard (or
with the service-role key, which bypasses RLS). This means a public spam vector;
add a captcha or rate limit if it becomes a problem.

## Row-level security

`saved_performances` RLS lets a user read/create/delete only **their own** rows
(`auth.uid() = user_id`). The app talks to Supabase with the anon key, so these
policies are what actually protect the data — don't disable them.
