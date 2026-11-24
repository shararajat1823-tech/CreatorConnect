# CreatorConnect documentation

| Guide | What it covers |
| --- | --- |
| [environment.md](environment.md) | Every environment variable, for local and production |
| [supabase.md](supabase.md) | Create the project, apply migrations + storage policies, email + redirect URLs, first admin |
| [deployment.md](deployment.md) | Import the repo into Vercel as two projects (marketplace + admin) |
| [go-live.md](go-live.md) | Preview setup and the launch checklist (and which steps need your accounts) |
| [testing.md](testing.md) | What is tested and how to run each suite |

## Architecture at a glance

```
            ┌──────────────────────────┐        ┌───────────────────────┐
 visitors → │ apps/marketplace (Angular│        │ apps/admin (React/Vite│ ← invited admins
            │  SSR): public directory, │        │  SPA): moderation,    │
            │  profiles, onboarding,   │        │  reports              │
            │  inbox                   │        │                       │
            └───────────┬──────────────┘        └───────────┬───────────┘
                        │  supabase-js (anon key, RLS)       │
                        └────────────────┬───────────────────┘
                                         ▼
                      ┌───────────────────────────────────────┐
                      │ Supabase: Postgres + Auth + Storage    │
                      │  • RLS: public reads only public_creators
                      │  • SECURITY DEFINER RPCs for every write
                      │  • admins role (not self-assignable)   │
                      └───────────────────────────────────────┘
```

### Key design decisions

- **Two creator tables.** `creators` is the owner's editable, moderated record; the
  public only ever reads `public_creators`, an approved projection. This is how
  "edits to a published profile are reviewed before the changes go live" and
  "suspended/unlisted profiles stop appearing" are enforced at the database level.
- **Writes go through `SECURITY DEFINER` functions.** Submitting, approving,
  suspending, sending a request, replying, reporting and resolving all run through
  RPCs that check permissions, rate-limit, validate input and keep an audit log.
  RLS then exposes almost no direct `INSERT`/`UPDATE` to clients.
- **No service keys in the browser.** Both apps use only the public anon key.
  Admin power comes from the `admins` role checked by RLS, never from a secret.
- **SSR for discovery.** The public directory and profiles are server-rendered on
  demand, so a newly approved creator is crawlable and shareable without a redeploy.
  Marketing pages are prerendered.

See the repository root [`README.md`](../README.md) for commands and renaming.
