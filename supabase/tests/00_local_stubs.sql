-- Minimal local stub of the Supabase-provided auth/storage schemas, so the
-- CreatorConnect migrations can be validated without the full Supabase stack.
-- This file is NOT part of the product; it only exists for local SQL testing.

do $$ begin
  if not exists (select from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
  if not exists (select from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if;
end $$;
grant anon, authenticated, service_role to postgres;

create extension if not exists pgcrypto;
create schema if not exists auth;
create schema if not exists storage;

-- Simulated auth.uid(): reads a GUC we set per test session.
create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('app.current_user', true), '')::uuid;
$$;

create table if not exists auth.users (
  instance_id uuid,
  id uuid primary key default gen_random_uuid(),
  aud text,
  role text,
  email text unique,
  encrypted_password text,
  email_confirmed_at timestamptz,
  raw_app_meta_data jsonb default '{}',
  raw_user_meta_data jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  confirmation_token text default '',
  email_change text default '',
  email_change_token_new text default '',
  recovery_token text default ''
);

create table if not exists auth.identities (
  id uuid primary key default gen_random_uuid(),
  provider_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  identity_data jsonb not null,
  provider text not null,
  last_sign_in_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists storage.buckets (
  id text primary key,
  name text not null,
  public boolean default false,
  file_size_limit bigint,
  allowed_mime_types text[],
  created_at timestamptz default now()
);

create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id),
  name text,
  owner uuid,
  created_at timestamptz default now()
);

create or replace function storage.foldername(name text) returns text[]
language plpgsql immutable as $$
declare parts text[];
begin
  parts := string_to_array(name, '/');
  if array_length(parts,1) is null or array_length(parts,1) < 2 then
    return array[]::text[];
  end if;
  return parts[1:array_length(parts,1)-1];
end;
$$;

grant usage on schema auth, storage to anon, authenticated, service_role;
grant select on auth.users to authenticated, service_role;
