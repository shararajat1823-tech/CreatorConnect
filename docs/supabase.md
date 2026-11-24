# Supabase setup

> Steps marked **(your account)** require access to your own Supabase project.

## 1. Create the project (your account)

1. Create a project at [supabase.com](https://supabase.com).
2. Copy the **Project URL** and **anon public key** from Project Settings → API
   into your `.env` files (see [environment.md](environment.md)).

## 2. Apply the database migrations

The migrations are in `supabase/migrations/` and must be applied **in order**
(`0001` → `0004`). Choose one method:

### Option A — Supabase CLI (recommended)

```bash
npm i -g supabase          # or: brew install supabase/tap/supabase
supabase link --project-ref <your-project-ref>
supabase db push           # applies all migrations in supabase/migrations
```

### Option B — SQL editor

Open the dashboard **SQL editor** and paste the contents of each file, in order:
`0001_schema.sql`, `0002_functions.sql`, `0003_rls.sql`, `0004_storage.sql`, running
each one before the next.

> **Do not** run anything in `supabase/tests/` against your project — those files
> (`00_local_stubs.sql`) only exist to emulate Supabase on a bare local Postgres.

## 3. Storage

`0004_storage.sql` creates a **public** `creator-avatars` bucket limited to
JPEG/PNG/WebP up to 5 MB, with per-user folder upload policies. No extra steps —
verify it exists under **Storage** in the dashboard.

## 4. Auth configuration (your account)

Dashboard → **Authentication**:

- **Providers → Email**: enable **Confirm email** (matches local config).
- **URL Configuration**:
  - **Site URL**: your marketplace URL, e.g. `https://creatorconnect.com`
  - **Redirect URLs**: add
    - `https://creatorconnect.com/auth/confirm`
    - `https://creatorconnect.com/auth/update-password`
    - (and the `http://localhost:4200` equivalents for local testing)
- **Email**: for production, configure **SMTP** (Authentication → Emails → SMTP
  Settings) with your provider (e.g. Resend, Postmark, SendGrid). The default
  Supabase email sender is rate-limited and for testing only. **(your account)**

## 5. Provision the first admin (your account)

Admins can't be self-assigned (enforced by RLS). Create the first one with the
service role from the **SQL editor**:

```sql
-- 1) First, sign up this email through the marketplace and confirm it.
-- 2) Then run (SQL editor runs as a privileged role):
insert into public.admins (user_id)
select id from auth.users where email = 'you@example.com'
on conflict do nothing;
```

That account can now sign in to the admin app and grant admin to others from the
`admins` table (RLS allows existing admins to insert).

## 6. (Optional) Load demo data locally

`supabase/seed.sql` is a **clearly-labelled fictional dataset for local dev only**.
With the CLI and local stack:

```bash
supabase start      # local Postgres + Auth + Storage + Inbucket mailbox
supabase db reset   # applies migrations + seed.sql (see supabase/config.toml)
```

Demo accounts all use the password `password123` (e.g. `admin@creatorconnect.example`,
`brand@acme.example`, `maya@creators.example`). **Keep demo data out of production.**

Confirmation emails in local dev land in Inbucket at `http://localhost:54324`.
