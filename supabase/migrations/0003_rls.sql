-- CreatorConnect — Row Level Security
-- Principle:
--   * Public (anon) can read ONLY public_creators.
--   * creators is readable by its owner and admins; writable by its owner
--     (status/ownership guarded by triggers).
--   * requests/messages are visible only to their participants.
--   * All privileged writes (publish, suspend, send request, reply, report,
--     resolve) go through SECURITY DEFINER functions, so most tables expose no
--     INSERT/UPDATE policy at all.

-- Schema usage (usually already granted by Supabase; explicit for clarity).
grant usage on schema public to anon, authenticated;

-- ---------------------------------------------------------------------------
-- members
-- ---------------------------------------------------------------------------
alter table public.members enable row level security;
grant select, update on public.members to authenticated;

create policy members_select_self on public.members
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy members_update_self on public.members
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- admins (role table) — a user can never grant admin to themselves.
-- The first admin is created with the service role (see docs/supabase.md).
-- ---------------------------------------------------------------------------
alter table public.admins enable row level security;
grant select, insert, update, delete on public.admins to authenticated;

create policy admins_select on public.admins
  for select to authenticated
  using (public.is_admin());

create policy admins_insert on public.admins
  for insert to authenticated
  with check (public.is_admin());

create policy admins_delete on public.admins
  for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- creators (owner-editable; not public)
-- ---------------------------------------------------------------------------
alter table public.creators enable row level security;
grant select, insert, update, delete on public.creators to authenticated;

create policy creators_select on public.creators
  for select to authenticated
  using (owner_id = auth.uid() or public.is_admin());

create policy creators_insert on public.creators
  for insert to authenticated
  with check (owner_id = auth.uid());

create policy creators_update_own on public.creators
  for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy creators_delete_own on public.creators
  for delete to authenticated
  using (owner_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- public_creators (the only publicly readable table)
-- Writes happen exclusively via SECURITY DEFINER functions (no write policy).
-- ---------------------------------------------------------------------------
alter table public.public_creators enable row level security;
grant select on public.public_creators to anon, authenticated;

create policy public_creators_read on public.public_creators
  for select to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- requests (participants only; writes via functions)
-- ---------------------------------------------------------------------------
alter table public.requests enable row level security;
grant select on public.requests to authenticated;

create policy requests_select_participant on public.requests
  for select to authenticated
  using (sender_id = auth.uid() or recipient_id = auth.uid());

-- ---------------------------------------------------------------------------
-- messages (thread participants only; writes via functions)
-- ---------------------------------------------------------------------------
alter table public.messages enable row level security;
grant select on public.messages to authenticated;

create policy messages_select_participant on public.messages
  for select to authenticated
  using (
    exists (
      select 1 from public.requests r
      where r.id = messages.request_id
        and (r.sender_id = auth.uid() or r.recipient_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- moderation_actions (admins + the affected owner; writes via functions)
-- ---------------------------------------------------------------------------
alter table public.moderation_actions enable row level security;
grant select on public.moderation_actions to authenticated;

create policy moderation_select on public.moderation_actions
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.creators c
      where c.id = moderation_actions.creator_id and c.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- reports (admins + the reporter; writes via functions)
-- ---------------------------------------------------------------------------
alter table public.reports enable row level security;
grant select on public.reports to authenticated;

create policy reports_select on public.reports
  for select to authenticated
  using (public.is_admin() or reporter_id = auth.uid());
