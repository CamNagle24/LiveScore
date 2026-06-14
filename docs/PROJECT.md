# LiveListen — Project

Live performance discovery app. Users browse/track live performances and bookmark
("save") them per-user.

## Stack
- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS
- Supabase (Auth with cookie sessions via `@supabase/ssr`; Postgres with RLS)
- Deploy: Vercel

## Run
```bash
npm install
npm run dev          # http://localhost:3000
```

## Env (.env.local — never commit)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (metadata + OAuth redirects)
- `ADMIN_EMAILS` (comma-separated; gate for `/developer`)

## Auth & DB
- Supabase Auth, Email + Google providers. Google redirect: `<site>/auth/callback`.
- `supabase/saved.sql` creates `saved_performances` (per-user, RLS-protected).
- `/profile` requires sign-in; `/developer` requires an email in `ADMIN_EMAILS`
  (enforced in `src/middleware.ts` and `src/app/developer/layout.tsx`).

## Key paths
- `src/app/` — routes (incl. `auth/callback`, `developer/`, `profile/`)
- `src/components/`, `src/lib/`, `src/middleware.ts`, `src/proxy.ts`
- `supabase/` — SQL

> Heads up (see AGENTS.md): this Next.js version has breaking changes vs. training
> data. Read `node_modules/next/dist/docs/` before writing Next.js code.
