This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment variables

Create `.env.local` (and set the same vars in Vercel):

```bash
NEXT_PUBLIC_SUPABASE_URL=...            # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=...       # Supabase anon key
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # used for metadata + OAuth redirects
ADMIN_EMAILS=you@example.com            # comma-separated; who may access /developer
```

## Auth & database setup

- Auth uses Supabase Auth with cookie sessions (`@supabase/ssr`). Enable **Email** and
  **Google** providers in the Supabase dashboard. For Google, add a Google Cloud OAuth client
  and set the redirect URL to `<site>/auth/callback`.
- Run [`supabase/saved.sql`](./supabase/saved.sql) in the Supabase SQL editor to create the
  `saved_performances` table (per-user bookmarks, RLS-protected).
- `/profile` requires sign-in; `/developer` requires an email listed in `ADMIN_EMAILS`
  (enforced in `src/middleware.ts` and `src/app/developer/layout.tsx`).

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
