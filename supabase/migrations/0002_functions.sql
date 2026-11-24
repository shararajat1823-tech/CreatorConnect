-- CreatorConnect — privileged functions and guards
-- All state transitions go through SECURITY DEFINER functions so that RLS can
-- forbid direct writes to sensitive columns/tables.

-- ---------------------------------------------------------------------------
-- New auth user -> members row
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.members (id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Role helper
-- ---------------------------------------------------------------------------
create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.admins a where a.user_id = uid);
$$;

grant execute on function public.is_admin(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Guard: creators.status can only change via privileged functions below,
-- which set app.privileged = 'on' for the transaction.
-- ---------------------------------------------------------------------------
create or replace function public.guard_creator_status()
returns trigger
language plpgsql
as $$
begin
  if coalesce(current_setting('app.privileged', true), 'off') <> 'on' then
    -- Only privileged moderation/owner functions may change these.
    if new.status is distinct from old.status then
      raise exception 'Creator status can only be changed through moderation functions';
    end if;
    if new.ownership_verified is distinct from old.ownership_verified then
      raise exception 'ownership_verified can only be set by an ownership check';
    end if;
    -- Ownership and audit timestamps are not owner-editable.
    new.owner_id := old.owner_id;
    new.published_at := old.published_at;
  end if;
  return new;
end;
$$;

create trigger creators_guard_status_trg
  before update on public.creators
  for each row execute function public.guard_creator_status();

-- ---------------------------------------------------------------------------
-- Internal: copy a creator's current content into the public projection.
-- ---------------------------------------------------------------------------
create or replace function public.sync_public_creator(p_creator_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare c public.creators;
begin
  select * into c from public.creators where id = p_creator_id;
  if not found then
    raise exception 'Creator % not found', p_creator_id;
  end if;

  insert into public.public_creators as pc (
    creator_id, slug, channel_name, youtube_url, avatar_path, bio, niches, languages,
    country, subscriber_count, subscriber_range, subscribers_self_reported, formats,
    videos, pricing, ownership_verified, published_at
  )
  values (
    c.id, c.slug, c.channel_name, c.youtube_url, c.avatar_path, c.bio, c.niches, c.languages,
    c.country, c.subscriber_count, c.subscriber_range, c.subscribers_self_reported, c.formats,
    c.videos, c.pricing, c.ownership_verified, now()
  )
  on conflict (creator_id) do update set
    slug = excluded.slug,
    channel_name = excluded.channel_name,
    youtube_url = excluded.youtube_url,
    avatar_path = excluded.avatar_path,
    bio = excluded.bio,
    niches = excluded.niches,
    languages = excluded.languages,
    country = excluded.country,
    subscriber_count = excluded.subscriber_count,
    subscriber_range = excluded.subscriber_range,
    subscribers_self_reported = excluded.subscribers_self_reported,
    formats = excluded.formats,
    videos = excluded.videos,
    pricing = excluded.pricing,
    ownership_verified = excluded.ownership_verified,
    published_at = pc.published_at;
end;
$$;

-- ---------------------------------------------------------------------------
-- Owner action: submit a draft / revised profile for review.
-- ---------------------------------------------------------------------------
create or replace function public.submit_creator_for_review(p_creator_id uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare c public.creators;
begin
  select * into c from public.creators where id = p_creator_id;
  if not found then raise exception 'Creator not found'; end if;
  if c.owner_id <> auth.uid() then raise exception 'Not your profile'; end if;
  if c.status not in ('draft','changes_requested','published') then
    raise exception 'Profile cannot be submitted from its current status (%).', c.status;
  end if;
  if not public.is_valid_channel_url(c.youtube_url) then
    raise exception 'A valid YouTube channel URL is required before submitting.';
  end if;

  perform set_config('app.privileged', 'on', true);
  update public.creators
    set status = 'under_review', submitted_at = now(), review_note = null
    where id = p_creator_id;
  return 'under_review';
end;
$$;

-- ---------------------------------------------------------------------------
-- Owner/admin action: unpublish (remove from the public directory).
-- ---------------------------------------------------------------------------
create or replace function public.unpublish_creator(p_creator_id uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare c public.creators;
begin
  select * into c from public.creators where id = p_creator_id;
  if not found then raise exception 'Creator not found'; end if;
  if c.owner_id <> auth.uid() and not public.is_admin() then
    raise exception 'Not permitted';
  end if;

  perform set_config('app.privileged', 'on', true);
  update public.creators set status = 'draft', published_at = null where id = p_creator_id;
  delete from public.public_creators where creator_id = p_creator_id;
  insert into public.moderation_actions (creator_id, actor_id, action, reason)
    values (p_creator_id, auth.uid(), 'unpublished', null);
  return 'draft';
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin action: approve -> publish.
-- ---------------------------------------------------------------------------
create or replace function public.approve_creator(p_creator_id uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then raise exception 'Admin role required'; end if;
  if not exists (select 1 from public.creators where id = p_creator_id) then
    raise exception 'Creator not found';
  end if;

  perform set_config('app.privileged', 'on', true);
  update public.creators
    set status = 'published', published_at = now(), review_note = null
    where id = p_creator_id;
  perform public.sync_public_creator(p_creator_id);
  insert into public.moderation_actions (creator_id, actor_id, action, reason)
    values (p_creator_id, auth.uid(), 'approved', null);
  return 'published';
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin action: request changes (keeps any existing public listing untouched).
-- ---------------------------------------------------------------------------
create or replace function public.request_creator_changes(p_creator_id uuid, p_reason text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then raise exception 'Admin role required'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'A reason is required'; end if;
  if not exists (select 1 from public.creators where id = p_creator_id) then
    raise exception 'Creator not found';
  end if;

  perform set_config('app.privileged', 'on', true);
  update public.creators
    set status = 'changes_requested', review_note = p_reason
    where id = p_creator_id;
  insert into public.moderation_actions (creator_id, actor_id, action, reason)
    values (p_creator_id, auth.uid(), 'changes_requested', p_reason);
  return 'changes_requested';
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin action: suspend (removes the public listing).
-- ---------------------------------------------------------------------------
create or replace function public.suspend_creator(p_creator_id uuid, p_reason text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then raise exception 'Admin role required'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'A reason is required'; end if;
  if not exists (select 1 from public.creators where id = p_creator_id) then
    raise exception 'Creator not found';
  end if;

  perform set_config('app.privileged', 'on', true);
  update public.creators set status = 'suspended', review_note = p_reason where id = p_creator_id;
  delete from public.public_creators where creator_id = p_creator_id;
  insert into public.moderation_actions (creator_id, actor_id, action, reason)
    values (p_creator_id, auth.uid(), 'suspended', p_reason);
  return 'suspended';
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin action: reinstate a suspended profile back to published.
-- ---------------------------------------------------------------------------
create or replace function public.reinstate_creator(p_creator_id uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then raise exception 'Admin role required'; end if;
  if not exists (select 1 from public.creators where id = p_creator_id) then
    raise exception 'Creator not found';
  end if;

  perform set_config('app.privileged', 'on', true);
  update public.creators
    set status = 'published', published_at = now(), review_note = null
    where id = p_creator_id;
  perform public.sync_public_creator(p_creator_id);
  insert into public.moderation_actions (creator_id, actor_id, action, reason)
    values (p_creator_id, auth.uid(), 'reinstated', null);
  return 'published';
end;
$$;

grant execute on function public.submit_creator_for_review(uuid) to authenticated;
grant execute on function public.unpublish_creator(uuid) to authenticated;
grant execute on function public.approve_creator(uuid) to authenticated;
grant execute on function public.request_creator_changes(uuid, text) to authenticated;
grant execute on function public.suspend_creator(uuid, text) to authenticated;
grant execute on function public.reinstate_creator(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Server-side YouTube channel URL validation (mirrors shared/validation.ts).
-- ---------------------------------------------------------------------------
create or replace function public.is_valid_channel_url(url text)
returns boolean
language sql
immutable
as $$
  select url is not null and (
    url ~* '^https?://(www\.|m\.)?youtube\.com/@[A-Za-z0-9._-]{3,30}/?$' or
    url ~* '^https?://(www\.|m\.)?youtube\.com/channel/UC[A-Za-z0-9_-]{20,30}/?$' or
    url ~* '^https?://(www\.|m\.)?youtube\.com/c/[A-Za-z0-9._-]{1,80}/?$' or
    url ~* '^https?://(www\.|m\.)?youtube\.com/user/[A-Za-z0-9._-]{1,80}/?$'
  );
$$;

-- ---------------------------------------------------------------------------
-- Visitor action: create a request (idempotent via client token, rate limited).
-- ---------------------------------------------------------------------------
create or replace function public.create_request(
  p_creator_id uuid,
  p_request_type text,
  p_sender_name text,
  p_title text,
  p_message text,
  p_deliverables text,
  p_timeline text,
  p_budget_min integer,
  p_budget_max integer,
  p_currency text,
  p_budget_negotiable boolean,
  p_client_token text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_recipient uuid;
  v_id uuid;
  v_count int;
begin
  if auth.uid() is null then raise exception 'Sign in to send a request'; end if;
  if p_request_type not in ('paid_sponsorship','creator_collaboration') then
    raise exception 'Invalid request type';
  end if;
  if coalesce(trim(p_client_token), '') = '' then raise exception 'Missing request token'; end if;
  if coalesce(trim(p_title), '') = '' then raise exception 'A brief title is required'; end if;
  if coalesce(trim(p_message), '') = '' then raise exception 'A message is required'; end if;

  -- Only against listings that are currently public.
  if not exists (select 1 from public.public_creators where creator_id = p_creator_id) then
    raise exception 'This creator is not available to contact';
  end if;
  select owner_id into v_recipient from public.creators where id = p_creator_id;
  if v_recipient = auth.uid() then raise exception 'You cannot send a request to your own channel'; end if;

  -- Idempotency: a retried submission with the same token returns the first row.
  select id into v_id from public.requests
    where sender_id = auth.uid() and client_token = p_client_token;
  if v_id is not null then return v_id; end if;

  -- Rate limit: at most 20 new requests per hour per sender.
  select count(*) into v_count from public.requests
    where sender_id = auth.uid() and created_at > now() - interval '1 hour';
  if v_count >= 20 then raise exception 'Too many requests — please try again later'; end if;

  insert into public.requests (
    creator_id, sender_id, recipient_id, request_type, sender_name, title,
    deliverables, timeline, budget_min, budget_max, currency, budget_negotiable, client_token
  )
  values (
    p_creator_id, auth.uid(), v_recipient, p_request_type, left(trim(p_sender_name),120),
    left(trim(p_title),120), nullif(trim(p_deliverables),''), nullif(trim(p_timeline),''),
    case when p_budget_negotiable then null else p_budget_min end,
    case when p_budget_negotiable then null else p_budget_max end,
    case when p_budget_negotiable then null else p_currency end,
    coalesce(p_budget_negotiable,false), p_client_token
  )
  returning id into v_id;

  insert into public.messages (request_id, sender_id, body)
    values (v_id, auth.uid(), left(trim(p_message),4000));

  return v_id;
end;
$$;

grant execute on function public.create_request(uuid, text, text, text, text, text, text, integer, integer, text, boolean, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Post a reply into a request thread (participants only, rate limited).
-- ---------------------------------------------------------------------------
create or replace function public.post_message(p_request_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare r public.requests; v_id uuid; v_count int;
begin
  if auth.uid() is null then raise exception 'Sign in to reply'; end if;
  if coalesce(trim(p_body), '') = '' then raise exception 'Message cannot be empty'; end if;

  select * into r from public.requests where id = p_request_id;
  if not found then raise exception 'Conversation not found'; end if;
  if auth.uid() <> r.sender_id and auth.uid() <> r.recipient_id then
    raise exception 'You are not a participant in this conversation';
  end if;
  if r.status in ('withdrawn','declined') then
    raise exception 'This request is closed';
  end if;

  select count(*) into v_count from public.messages
    where sender_id = auth.uid() and created_at > now() - interval '5 minutes';
  if v_count >= 30 then raise exception 'Too many messages — slow down a little'; end if;

  insert into public.messages (request_id, sender_id, body)
    values (p_request_id, auth.uid(), left(trim(p_body),4000))
    returning id into v_id;

  update public.requests set updated_at = now() where id = p_request_id;
  return v_id;
end;
$$;

grant execute on function public.post_message(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Accept / decline (recipient) or withdraw (sender) a pending request.
-- ---------------------------------------------------------------------------
create or replace function public.set_request_status(p_request_id uuid, p_status text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare r public.requests;
begin
  select * into r from public.requests where id = p_request_id;
  if not found then raise exception 'Request not found'; end if;

  if p_status in ('accepted','declined') then
    if auth.uid() <> r.recipient_id then raise exception 'Only the recipient can do that'; end if;
    if r.status <> 'pending' then raise exception 'Only pending requests can be updated'; end if;
  elsif p_status = 'withdrawn' then
    if auth.uid() <> r.sender_id then raise exception 'Only the sender can withdraw'; end if;
    if r.status <> 'pending' then raise exception 'Only pending requests can be withdrawn'; end if;
  else
    raise exception 'Invalid status';
  end if;

  update public.requests set status = p_status where id = p_request_id;
  return p_status;
end;
$$;

grant execute on function public.set_request_status(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Report a listing (signed-in, rate limited, de-duplicated).
-- ---------------------------------------------------------------------------
create or replace function public.report_creator(p_creator_id uuid, p_reason text, p_details text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_id uuid; v_count int;
begin
  if auth.uid() is null then raise exception 'Sign in to report a profile'; end if;
  if p_reason not in ('misleading','impersonation','spam','inappropriate','not_a_real_channel','other') then
    raise exception 'Invalid reason';
  end if;
  if not exists (select 1 from public.public_creators where creator_id = p_creator_id) then
    raise exception 'Listing not found';
  end if;

  -- de-dup: one open report per reporter per creator
  select id into v_id from public.reports
    where creator_id = p_creator_id and reporter_id = auth.uid() and status in ('open','reviewing');
  if v_id is not null then return v_id; end if;

  select count(*) into v_count from public.reports
    where reporter_id = auth.uid() and created_at > now() - interval '1 hour';
  if v_count >= 10 then raise exception 'Too many reports — please try again later'; end if;

  insert into public.reports (creator_id, reporter_id, reason, details)
    values (p_creator_id, auth.uid(), p_reason, nullif(trim(p_details),''))
    returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.report_creator(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Admin: resolve / dismiss a report.
-- ---------------------------------------------------------------------------
create or replace function public.resolve_report(p_report_id uuid, p_status text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then raise exception 'Admin role required'; end if;
  if p_status not in ('open','reviewing','resolved','dismissed') then
    raise exception 'Invalid status';
  end if;

  update public.reports
    set status = p_status,
        resolved_by = case when p_status in ('resolved','dismissed') then auth.uid() else null end,
        resolved_at = case when p_status in ('resolved','dismissed') then now() else null end
    where id = p_report_id;
  return p_status;
end;
$$;

grant execute on function public.resolve_report(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Member: request account deletion (flags the account and removes public data).
-- Actual auth.users deletion is performed by an operator / scheduled job.
-- ---------------------------------------------------------------------------
create or replace function public.request_account_deletion()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_creator uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  update public.members set deletion_requested_at = now() where id = auth.uid();

  select id into v_creator from public.creators where owner_id = auth.uid();
  if v_creator is not null then
    perform set_config('app.privileged', 'on', true);
    update public.creators set status = 'draft', published_at = null where id = v_creator;
    delete from public.public_creators where creator_id = v_creator;
  end if;
end;
$$;

grant execute on function public.request_account_deletion() to authenticated;
