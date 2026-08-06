-- Reminder opt-in: per-user toggle on saved performances.
-- Run this in the Supabase SQL editor after saved.sql.

alter table saved_performances
  add column if not exists reminder_opt_in boolean not null default false;

-- Allow users to update their own saved_performances rows (for the toggle).
create policy if not exists "saved - update own"
  on saved_performances for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
