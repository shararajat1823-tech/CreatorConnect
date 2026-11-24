-- CreatorConnect — core schema
-- Tables, constraints, indexes and content triggers.
-- Row Level Security and privileged functions are added in later migrations.

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ---------------------------------------------------------------------------
-- Reference arrays used by CHECK constraints (keep in sync with
-- packages/shared/src/domain.ts).
-- ---------------------------------------------------------------------------
-- creator_status: draft | under_review | changes_requested | published | suspended
-- collab formats: sponsored_mention | dedicated_video | shorts | product_review
--                 | guest_appearance | joint_video
-- request_type:  paid_sponsorship | creator_collaboration
-- request_status: pending | accepted | declined | withdrawn
-- report_reason: misleading | impersonation | spam | inappropriate
--                | not_a_real_channel | other
-- report_status: open | reviewing | resolved | dismissed

-- ---------------------------------------------------------------------------
-- members: one row per authenticated user (mirror of auth.users)
-- ---------------------------------------------------------------------------
create table public.members (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 120),
  created_at timestamptz not null default now(),
  deletion_requested_at timestamptz
);

comment on table public.members is 'Public-facing member record, 1:1 with auth.users.';

-- ---------------------------------------------------------------------------
-- admins: presence of a row grants the admin role. Rows can only be created
-- by an existing admin or the service role (enforced by RLS) — a user can
-- never grant admin to themselves.
-- ---------------------------------------------------------------------------
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id)
);

comment on table public.admins is 'Admin role assignments. Insert is restricted to existing admins / service role.';

-- ---------------------------------------------------------------------------
-- creators: the owner's working/canonical record (what moderation reviews).
-- The public never reads this table directly — see public_creators.
-- ---------------------------------------------------------------------------
create table public.creators (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  slug text not null unique,
  status text not null default 'draft'
    check (status in ('draft','under_review','changes_requested','published','suspended')),

  channel_name text not null check (char_length(channel_name) between 1 and 80),
  youtube_url text not null,
  youtube_ref text,
  avatar_path text,
  bio text check (char_length(bio) <= 2000),

  niches text[] not null default '{}'
    check (niches <@ array['gaming','tech','beauty','fitness','food','travel','education',
      'finance','lifestyle','music','comedy','diy','parenting','sports','arts']::text[]),
  constraint creators_niches_max check (array_length(niches, 1) is null or array_length(niches, 1) <= 3),
  languages text[] not null default '{}'
    check (languages <@ array['en','es','hi','pt','fr','de','ja','ko','ar','id','ru','it']::text[]),
  country text check (char_length(country) <= 8),

  subscriber_count integer check (subscriber_count is null or subscriber_count >= 0),
  subscriber_range text,
  subscribers_self_reported boolean not null default true,

  formats text[] not null default '{}'
    check (formats <@ array['sponsored_mention','dedicated_video','shorts','product_review',
      'guest_appearance','joint_video']::text[]),
  videos jsonb not null default '[]'::jsonb,
  pricing jsonb,

  ownership_verified boolean not null default false,
  review_note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  published_at timestamptz,

  -- one profile per account at launch
  unique (owner_id)
);

create index creators_owner_idx on public.creators (owner_id);
create index creators_status_idx on public.creators (status);

comment on table public.creators is 'Owner-editable creator record reviewed by moderation. Not publicly readable.';

-- ---------------------------------------------------------------------------
-- public_creators: the approved, public projection. Anon/authenticated read
-- this; only privileged functions write it. Columns are filterable for the
-- directory.
-- ---------------------------------------------------------------------------
create table public.public_creators (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null unique references public.creators (id) on delete cascade,
  slug text not null unique,
  channel_name text not null,
  youtube_url text not null,
  avatar_path text,
  bio text,
  niches text[] not null default '{}',
  languages text[] not null default '{}',
  country text,
  subscriber_count integer,
  subscriber_range text,
  subscribers_self_reported boolean not null default true,
  formats text[] not null default '{}',
  videos jsonb not null default '[]'::jsonb,
  pricing jsonb,
  ownership_verified boolean not null default false,
  published_at timestamptz not null default now()
);

create index public_creators_slug_idx on public.public_creators (slug);
create index public_creators_niches_idx on public.public_creators using gin (niches);
create index public_creators_languages_idx on public.public_creators using gin (languages);
create index public_creators_formats_idx on public.public_creators using gin (formats);
create index public_creators_country_idx on public.public_creators (country);
create index public_creators_range_idx on public.public_creators (subscriber_range);
create index public_creators_name_trgm_idx on public.public_creators using gin (lower(channel_name) gin_trgm_ops);

comment on table public.public_creators is 'Approved, public creator listings. Written only by privileged functions.';

-- ---------------------------------------------------------------------------
-- requests: a sponsorship brief or collaboration proposal.
-- ---------------------------------------------------------------------------
create table public.requests (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  recipient_id uuid not null references auth.users (id) on delete cascade,
  request_type text not null check (request_type in ('paid_sponsorship','creator_collaboration')),
  status text not null default 'pending'
    check (status in ('pending','accepted','declined','withdrawn')),

  sender_name text not null check (char_length(sender_name) between 1 and 120),
  title text not null check (char_length(title) between 1 and 120),
  deliverables text check (char_length(deliverables) <= 1000),
  timeline text check (char_length(timeline) <= 200),

  budget_min integer check (budget_min is null or budget_min >= 0),
  budget_max integer check (budget_max is null or budget_max >= 0),
  currency text check (currency is null or currency in ('USD','EUR','GBP','INR','BRL','CAD','AUD','JPY')),
  budget_negotiable boolean not null default false,

  client_token text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (sender_id <> recipient_id),
  unique (sender_id, client_token)
);

create index requests_creator_idx on public.requests (creator_id);
create index requests_sender_idx on public.requests (sender_id, created_at desc);
create index requests_recipient_idx on public.requests (recipient_id, created_at desc);

comment on table public.requests is 'Sponsorship / collaboration requests. First message stored in messages.';

-- ---------------------------------------------------------------------------
-- messages: thread replies within a request.
-- ---------------------------------------------------------------------------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index messages_request_idx on public.messages (request_id, created_at);

-- ---------------------------------------------------------------------------
-- moderation_actions: an append-only audit log of moderation decisions.
-- ---------------------------------------------------------------------------
create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators (id) on delete cascade,
  actor_id uuid not null references auth.users (id),
  action text not null
    check (action in ('approved','changes_requested','suspended','unpublished','reinstated')),
  reason text check (char_length(reason) <= 1000),
  created_at timestamptz not null default now()
);

create index moderation_creator_idx on public.moderation_actions (creator_id, created_at desc);

-- ---------------------------------------------------------------------------
-- reports: visitor reports about a listing.
-- ---------------------------------------------------------------------------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators (id) on delete cascade,
  reporter_id uuid references auth.users (id) on delete set null,
  reason text not null
    check (reason in ('misleading','impersonation','spam','inappropriate','not_a_real_channel','other')),
  details text check (char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now(),
  resolved_by uuid references auth.users (id),
  resolved_at timestamptz
);

create index reports_status_idx on public.reports (status, created_at desc);
create index reports_creator_idx on public.reports (creator_id);

-- ---------------------------------------------------------------------------
-- Content triggers (non-privileged): keep updated_at, slug, derived range.
-- Status transitions are guarded in 0002_functions.sql.
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Derive subscriber_range bucket from an exact count.
create or replace function public.derive_subscriber_range(count integer)
returns text
language sql
immutable
as $$
  select case
    when count is null then null
    when count < 1000 then 'under_1k'
    when count < 10000 then '1k_10k'
    when count < 100000 then '10k_100k'
    when count < 1000000 then '100k_1m'
    else '1m_plus'
  end;
$$;

-- Generate a unique slug from the channel name on first insert.
create or replace function public.creators_before_write()
returns trigger
language plpgsql
as $$
declare
  base text;
  candidate text;
  suffix int := 0;
begin
  new.subscriber_range := public.derive_subscriber_range(new.subscriber_count);

  if tg_op = 'INSERT' or new.slug is null or new.slug = '' then
    base := regexp_replace(lower(coalesce(new.channel_name,'creator')), '[^a-z0-9]+', '-', 'g');
    base := trim(both '-' from base);
    if base = '' then base := 'creator'; end if;
    base := left(base, 48);
    candidate := base;
    while exists (select 1 from public.creators c where c.slug = candidate and c.id <> coalesce(new.id, gen_random_uuid())) loop
      suffix := suffix + 1;
      candidate := base || '-' || suffix::text;
    end loop;
    new.slug := candidate;
  end if;

  return new;
end;
$$;

create trigger creators_before_write_trg
  before insert or update on public.creators
  for each row execute function public.creators_before_write();

create trigger creators_touch_trg
  before update on public.creators
  for each row execute function public.touch_updated_at();

create trigger requests_touch_trg
  before update on public.requests
  for each row execute function public.touch_updated_at();
