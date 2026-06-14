# Deploying LiveScore

A checklist for standing up auth + account-bound saved performances. The app
builds without these, but sign-in and saving fail at runtime until they're done.

## 1. Environment variables

Set these in Vercel (Project → Settings → Environment Variables) and, for local
dev, in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...            # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=...       # Supabase anon/public key
NEXT_PUBLIC_SITE_URL=https://your-domain  # used for metadata + OAuth redirects
ADMIN_EMAILS=you@example.com            # comma-separated; who may access /developer
```

- `NEXT_PUBLIC_*` vars are exposed to the browser — only use the **anon** key,
  never the service-role key.
- `ADMIN_EMAILS` is checked (case-insensitively) by the `proxy.ts` middleware to
  gate `/developer`.

## 2. Database

Run the migrations in [`supabase/`](./supabase/README.md) against your project
(Dashboard → SQL Editor):

- `saved.sql` — `saved_performances` table + RLS for account-bound bookmarks.
- `suggestions.sql` — `suggestions` table + RLS for the footer's "Suggest a
  performance" form. Without it, footer submissions fail silently.

Before running `saved.sql`, confirm `performances.id` is a **`text`** column —
it assumes string ids (see the note in `supabase/README.md`).

## 3. Auth providers

In Supabase → Authentication:

- **Email/password** — enabled by default. If "Confirm email" is on, new sign-ups
  must click the emailed link before they can sign in (the app handles this and
  shows a "check your email" notice).
- **Google OAuth** — enable the Google provider and add your client id/secret.
- **Redirect URLs** — under Authentication → URL Configuration, add the callback
  for every origin you use:
  - `http://localhost:3000/auth/callback` (local dev)
  - `https://your-domain/auth/callback` (production)

## 4. Verify the flow

Once 1–3 are in place:

1. Sign up / sign in at `/login` (email or Google).
2. Save a performance from `/search` (the ♥ on a card).
3. Confirm it appears at `/profile`.
4. With an `ADMIN_EMAILS` account, confirm `/developer` loads; with a
   non-admin account, confirm it redirects.

## Routes at a glance

| Route | Access |
|-------|--------|
| `/`, `/landing`, `/search`, `/artists`, `/venues`, `/artist/[name]` | public |
| `/login`, `/auth/callback` | public (auth entry points) |
| `/profile` | any signed-in user |
| `/developer` | signed-in admin (`ADMIN_EMAILS`) |

Access is enforced by `src/proxy.ts` (Next.js middleware).
