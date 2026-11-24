# Environment variables

All client-side values are **public by design** — the Supabase anon key is meant to
be exposed and is protected by Row Level Security. **Never** put the Supabase
`service_role` key in either app; it is not needed anywhere in this project.

## Marketplace (`apps/marketplace`)

Create `apps/marketplace/.env` from `.env.example`:

| Variable | Required | Example | Used for |
| --- | --- | --- | --- |
| `PUBLIC_SUPABASE_URL` | yes | `https://abcd.supabase.co` | API + storage |
| `PUBLIC_SUPABASE_ANON_KEY` | yes | `eyJhbGci…` | Public API access (RLS-gated) |
| `PUBLIC_SITE_URL` | yes (prod) | `https://creatorconnect.com` | Canonical URLs, social metadata, sitemap |

These are read at **build time** by `tools/generate-env.mjs`, which writes
`src/environments/environment.ts` (git-ignored). The script runs automatically on
`postinstall`, `prebuild` and `prestart`, so you rarely call it directly. On Vercel,
set the three variables in Project Settings and they are baked into the build.

> Both `PUBLIC_*` and un-prefixed (`SUPABASE_URL`, …) names are accepted, so the same
> values can be shared with the admin project if you prefer.

## Admin (`apps/admin`)

Create `apps/admin/.env` from `.env.example`:

| Variable | Required | Example | Used for |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | yes | `https://abcd.supabase.co` | API access |
| `VITE_SUPABASE_ANON_KEY` | yes | `eyJhbGci…` | Public API access (RLS-gated) |
| `VITE_MARKETPLACE_URL` | no | `https://creatorconnect.com` | "View live profile" links |

Vite reads `VITE_*` at build time via `import.meta.env`.

## Where to find the Supabase values

Supabase dashboard → your project → **Project Settings → API**:
- **Project URL** → `*_SUPABASE_URL`
- **Project API keys → `anon` `public`** → `*_SUPABASE_ANON_KEY`
