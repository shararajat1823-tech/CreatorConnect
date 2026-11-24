# Database / RLS acceptance tests

These tests validate the schema, Row Level Security policies and privileged
functions **without** the full Supabase stack — they run against a throwaway
local Postgres using small stubs for the Supabase-provided `auth`/`storage`
schemas (`00_local_stubs.sql`). The stubs are **test-only**; on a real Supabase
project those schemas already exist, so never apply `00_local_stubs.sql` there.

## Run

```bash
# needs a local Postgres you can reach as a superuser
./supabase/tests/run.sh
```

## What it checks (maps to the product acceptance tests)

| # | Assertion |
| --- | --- |
| 1 | `anon` can read `public_creators` only (not `creators`) |
| 2 | A visitor can create a request; a retried submit is idempotent |
| 3 | You cannot contact a non-public (draft / under-review / suspended) creator |
| 4 | You cannot send a request to your own channel |
| 5 | A third account cannot read a private thread; participants can |
| 6 | A non-admin cannot approve a listing or grant itself admin |
| 7 | An admin approval makes an under-review creator public |
| 8 | An admin suspension removes a creator from the public directory |
| 9 | An owner cannot change their own status, but can edit content |
| 10 | Recipient can accept, sender can withdraw a pending request |

A failing assertion aborts the run with a non-zero exit code.
