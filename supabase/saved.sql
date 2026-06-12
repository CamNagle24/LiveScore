-- Saved performances: per-user bookmarks of performances.
-- Run this in the Supabase SQL editor.

create table if not exists saved_performances (
  user_id uuid references auth.users on delete cascade,
  performance_id bigint references performances(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, performance_id)
);

alter table saved_performances enable row level security;

-- A user can only read / create / delete their own saved rows.
create policy "saved - select own"
  on saved_performances for select
  using (auth.uid() = user_id);

create policy "saved - insert own"
  on saved_performances for insert
  with check (auth.uid() = user_id);

create policy "saved - delete own"
  on saved_performances for delete
  using (auth.uid() = user_id);
