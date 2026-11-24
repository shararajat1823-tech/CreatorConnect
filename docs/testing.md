# Testing

| Suite | Command | What it covers | Needs |
| --- | --- | --- | --- |
| Shared unit | `npm run test:shared` | YouTube URL parsing, slugs, form validation, subscriber ranges | — |
| Admin unit | `npm run test:admin` | Label helpers + React component rendering (Vitest + Testing Library) | — |
| Both of the above | `npm test` | Shared + admin | — |
| Typecheck | `npm run typecheck` | Type-checks every workspace | — |
| Public e2e (browser) | `npm run test:e2e` | SSR + hydration + client routing + URL filters + real 404, driven by Playwright | One-time: `npx playwright install chromium` |
| Database / RLS | `npm run test:db` | Schema, RLS policies and the full moderation/request flow on a throwaway Postgres | a local Postgres superuser |

## Database / RLS acceptance tests

`supabase/tests/` validates the security model **without** the full Supabase stack,
using small local stubs for the `auth`/`storage` schemas. It asserts (mapping to the
product's acceptance criteria):

1. `anon` reads only `public_creators`, never `creators`.
2. A visitor can send a request; a retried submit is idempotent.
3. You can't contact a draft / under-review / suspended creator.
4. You can't send a request to your own channel.
5. A third account can't read a private thread; participants can.
6. A non-admin can't approve a listing or grant itself admin.
7. An admin approval makes an under-review creator public.
8. An admin suspension removes a creator from the public directory.
9. An owner can't change their own status, but can edit content.
10. Recipient can accept; sender can withdraw a pending request.

```bash
# needs a local Postgres you can reach as a superuser
npm run test:db
```

## What is not automated here

The **end-to-end signup→email-confirm→reply** journey against a live Supabase (real
auth emails, storage uploads) is covered by the manual checklist in
[go-live.md](go-live.md), because it needs your Supabase project and an email
provider. The database tests above already prove the authorization and state-machine
logic that journey depends on.
