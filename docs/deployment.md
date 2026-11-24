# Deploying to Vercel (two projects)

You import the **same GitHub repo** into Vercel **twice** — one project for the
marketplace (at your main domain) and one for the admin app (at an `admin.`
subdomain). Everything below marked **(your account)** needs your Vercel/domain
access.

Prerequisites: your Supabase project is set up ([supabase.md](supabase.md)) and you
have the URL + anon key.

## Project 1 — Marketplace (Angular SSR)

Vercel → **Add New → Project** → import the repo, then: **(your account)**

| Setting | Value |
| --- | --- |
| **Root Directory** | `apps/marketplace` |
| **Framework Preset** | **Angular** (Vercel detects SSR and deploys a function) |
| **Build Command** | leave default (`npm run build`) |
| **Output Directory** | leave default (the Angular preset handles `dist/marketplace`) |
| **Install Command** | leave default — Vercel installs the npm workspace from the repo root |

Environment Variables:

| Name | Value |
| --- | --- |
| `PUBLIC_SUPABASE_URL` | your Supabase URL |
| `PUBLIC_SUPABASE_ANON_KEY` | your anon key |
| `PUBLIC_SITE_URL` | your marketplace URL, e.g. `https://creatorconnect.com` |

> The build runs `packages/shared`'s build first (via the app's `prebuild`), so no
> extra monorepo configuration is needed. SSR, `/sitemap.xml` and `/robots.txt` are
> served by the Angular function.

**Domain:** assign your main domain (e.g. `creatorconnect.com`).

## Project 2 — Admin (React/Vite SPA)

Vercel → **Add New → Project** → import the **same** repo again: **(your account)**

| Setting | Value |
| --- | --- |
| **Root Directory** | `apps/admin` |
| **Framework Preset** | **Vite** |
| **Build Command** | leave default (`npm run build`) |
| **Output Directory** | `dist` |
| **Install Command** | leave default |

Environment Variables:

| Name | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | your Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | your anon key |
| `VITE_MARKETPLACE_URL` | your marketplace URL |

`apps/admin/vercel.json` rewrites all routes to `index.html`, so **direct links and
refreshes work** on client routes like `/moderation/<id>`.

**Domain:** assign an `admin.` subdomain (e.g. `admin.creatorconnect.com`).

## After deploying

1. In Supabase → Authentication → URL Configuration, make sure **Site URL** and the
   **Redirect URLs** use your real marketplace domain (`/auth/confirm`,
   `/auth/update-password`).
2. Open the marketplace, **sign up**, confirm the email, and verify you return to the
   app signed in.
3. Provision your first admin ([supabase.md §5](supabase.md)) and sign in to the admin
   app.
4. **Verify refresh works**: open a creator profile and an admin `/moderation/<id>`
   route, then reload — both should load directly (SSR for marketplace, SPA rewrite
   for admin).

## Previews

Every pull request gets a Vercel Preview Deployment for both projects. Preview URLs
differ from production, so:
- Add the preview domains to Supabase **Redirect URLs** if you want to test the full
  auth flow on a preview, **or** test auth on production/local where the redirect
  URLs are already configured.
