# CreatorConnect

> A marketplace for finding social media creators for paid sponsorships and creator collaborations.
> _CreatorConnect is a working name — see "Renaming" below._

A creator registers and submits a YouTube channel. An admin approves it. A visitor finds
the creator, signs in, sends a brief, and receives a reply in a private inbox.

This is an npm **workspaces monorepo** with two apps and shared code:

| Path | What it is | Stack |
| --- | --- | --- |
| `apps/marketplace` | Public website, directory, creator profiles, onboarding, member dashboards | **Angular 19 + SSR** |
| `apps/admin` | Private moderation dashboard | **React + Vite + TypeScript** |
| `packages/shared` | Design tokens, domain model, database types, validation | TypeScript |
| `supabase` | Database migrations, RLS policies, storage policies, seed data | SQL |

See [`docs/`](docs/) for full setup, deployment and go-live guides.

## Prerequisites

- **Node.js 22** (see [`.nvmrc`](.nvmrc)); Node ≥ 20.11 is supported.
- **npm 10+** (ships with Node).
- A [Supabase](https://supabase.com) project (free tier is fine) — see [`docs/supabase.md`](docs/supabase.md).

## Quick start (fresh clone)

```bash
# 1. Install everything (single lockfile, all workspaces)
npm install

# 2. Configure environment variables (see docs/environment.md)
cp apps/marketplace/.env.example apps/marketplace/.env
cp apps/admin/.env.example apps/admin/.env
# ...then edit both files with your Supabase URL + anon key

# 3. Build shared code, then run both apps together
npm run dev
#   marketplace → http://localhost:4200
#   admin       → http://localhost:5173
```

## Root commands

| Command | Does |
| --- | --- |
| `npm install` | Install all workspaces (one lockfile) |
| `npm run dev` | Run marketplace + admin together |
| `npm run build` | Build shared, marketplace (SSR) and admin |
| `npm test` | Run shared + admin unit tests (Vitest) |
| `npm run test:e2e` | Build the marketplace and run the Playwright public-site smoke test |
| `npm run test:db` | Run the database/RLS acceptance tests (needs a local Postgres) |
| `npm run typecheck` | Type-check every workspace |
| `npm run build:shared` | Build only the shared package |
| `npm run dev:marketplace` / `npm run dev:admin` | Run one app |

See [`docs/testing.md`](docs/testing.md) for what each suite covers.

## Renaming the product

`CreatorConnect` is a working name. To rename:

1. Edit `packages/shared/src/brand.ts` — `name`, `slug`, `tagline`, and the business
   details. Every UI surface reads the product name from here.
2. Update the domain in your deploy environment variables (`PUBLIC_SITE_URL`).
3. Optionally rename the GitHub repo and Vercel projects.

No product name is hard-coded anywhere else in the apps.

---

Full documentation: [`docs/README.md`](docs/README.md).
