-- Suggestions: performance ideas submitted by visitors via the site footer
-- ("Suggest a performance"). Run this in the Supabase SQL editor.
--
-- This is NOT the pipeline's `streaming_suggestions` table (TMDB-scan output
-- reviewed on /developer). It is a separate, simple inbox written by the
-- public SuggestFooter form in src/components/SuggestFooter.tsx.

create table if not exists suggestions (
  id bigint generated always as identity primary key,
  artist_name text not null,
  event_name text,
  link text,
  created_at timestamptz default now()
);

alter table suggestions enable row level security;

-- The footer is shown on public pages, so anonymous (signed-out) visitors must
-- be able to submit. Insert only — nobody reads this table through the anon
-- key; review submissions in the Supabase dashboard (or with the service-role
-- key, which bypasses RLS). There is intentionally no select/update/delete
-- policy, so the anon key cannot read or modify rows.
create policy "suggestions - public insert"
  on suggestions for insert
  to anon, authenticated
  with check (true);
