# Go-live checklist

Work top to bottom. Items marked **(needs your account)** require access to your
hosting, domain, email or Supabase accounts — I can't do these for you.

## Content & branding
- [ ] Set the product name / business details in `packages/shared/src/brand.ts`
      (search the code for `LAUNCH-EDIT`).
- [ ] Review Help / Contact / Privacy / Terms copy in
      `apps/marketplace/src/app/features/static/content.ts` (also `LAUNCH-EDIT`) —
      get the Privacy and Terms reviewed for your jurisdiction.

## Supabase (needs your account)
- [ ] Create the project; apply migrations `0001`–`0004`.
- [ ] Confirm the `creator-avatars` storage bucket exists (public, 5 MB, image types).
- [ ] Enable **Confirm email**.
- [ ] Set **Site URL** and **Redirect URLs** to your real domain
      (`/auth/confirm`, `/auth/update-password`).
- [ ] Configure **production SMTP** so account emails actually deliver.
- [ ] Provision the first admin (SQL insert into `public.admins`).
- [ ] Do **not** load `supabase/seed.sql` into production.

## Hosting / domain (needs your account)
- [ ] Deploy the marketplace project (Root Directory `apps/marketplace`, Angular).
- [ ] Deploy the admin project (Root Directory `apps/admin`, Vite).
- [ ] Set env vars on both (see [environment.md](environment.md)).
- [ ] Point your main domain at the marketplace and an `admin.` subdomain at admin.
- [ ] Confirm **HTTPS** is active on both domains (Vercel provisions certs automatically).

## Verify the full journey (do this on the deployed site)
- [ ] Sign up → receive confirmation email → confirm → land signed in.
- [ ] Create a channel listing → submit for review.
- [ ] As the admin, approve it → it appears in the directory and at
      `/creators/<slug>` **without a redeploy**.
- [ ] As a visitor, filter the directory, open the profile, send a sponsorship brief.
- [ ] As the creator, see the brief in the inbox, reply, and accept it.
- [ ] Suspend the listing in admin → confirm it disappears from the public directory.
- [ ] Refresh a creator profile URL and an admin detail URL directly — both load.
- [ ] Check the main journey on a phone and with keyboard-only navigation.

## Operational notes
- **Account deletion**: `request_account_deletion()` flags the account
  (`members.deletion_requested_at`) and removes the public listing immediately.
  Actually deleting the `auth.users` row is a privileged operation — do it with the
  service role / a scheduled job that honors flagged accounts. **(needs your account)**
- **Backups**: enable Supabase automatic backups for production. **(needs your account)**
