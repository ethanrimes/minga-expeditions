-- ============================================================================
-- 00_supabase_bootstrap.sql
-- Minimal, forward-compatible Supabase scaffolding for a *vanilla* Azure
-- Postgres Flexible Server, so the repo's 24 migrations (which assume the
-- Supabase stack already created roles, the auth/storage schemas and the
-- auth.uid()/role()/jwt() helpers) apply unchanged.
--
-- Everything here uses IF NOT EXISTS / CREATE OR REPLACE and mirrors Supabase's
-- real column shapes, so when GoTrue (auth) and storage-api are later layered
-- on via Container Apps they can adopt these objects instead of conflicting.
--
-- Run as the server admin (mingaadmin) BEFORE applying supabase/migrations/*.
-- ============================================================================

-- ---------- roles ----------------------------------------------------------
-- PostgREST/GoTrue use these. NOLOGIN here; the service wiring adds the LOGIN
-- "authenticator" role + passwords later (see infra/azure/README.md).
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end
$$;

-- Let the admin role assume the API roles (handy for testing RLS with SET ROLE).
grant anon, authenticated, service_role to current_user;

-- ---------- schemas --------------------------------------------------------
create schema if not exists auth;
create schema if not exists storage;
create schema if not exists extensions;
create schema if not exists graphql_public;

grant usage on schema auth to anon, authenticated, service_role;
grant usage on schema storage to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;

-- ---------- extensions -----------------------------------------------------
-- pgcrypto (gen_random_uuid etc.) and postgis must be allow-listed on the
-- Flexible Server via the azure.extensions server parameter first (the deploy
-- script does that + restarts). These CREATEs are idempotent.
create extension if not exists pgcrypto;
-- postgis is created by the geo migration; left out here so this file also runs
-- on servers where postgis hasn't been allow-listed yet.

-- ---------- auth: users + JWT helpers --------------------------------------
-- Supabase-compatible subset of auth.users. FKs (phone_verifications),
-- triggers (on_auth_user_created) and email look-ups in the migrations depend
-- on this table existing with at least (id, email).
create table if not exists auth.users (
  instance_id uuid,
  id uuid primary key default gen_random_uuid(),
  aud varchar(255),
  role varchar(255),
  email varchar(255),
  encrypted_password varchar(255),
  email_confirmed_at timestamptz,
  invited_at timestamptz,
  confirmation_token varchar(255),
  confirmation_sent_at timestamptz,
  recovery_token varchar(255),
  recovery_sent_at timestamptz,
  phone text unique,
  phone_confirmed_at timestamptz,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  is_anonymous boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

grant select on auth.users to authenticated, service_role;

-- current_setting('request.jwt.claims') is injected per-request by PostgREST.
create or replace function auth.jwt() returns jsonb
  language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')
  )::jsonb
$$;

create or replace function auth.uid() returns uuid
  language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

create or replace function auth.role() returns text
  language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;

create or replace function auth.email() returns text
  language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;

-- ---------- storage: buckets + objects -------------------------------------
create table if not exists storage.buckets (
  id text primary key,
  name text not null,
  owner uuid,
  public boolean default false,
  avif_autodetection boolean default false,
  file_size_limit bigint,
  allowed_mime_types text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id),
  name text,
  owner uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_accessed_at timestamptz default now(),
  metadata jsonb,
  path_tokens text[] generated always as (string_to_array(name, '/')) stored
);

create unique index if not exists bname on storage.objects (bucket_id, name);

alter table storage.objects enable row level security;

grant select on storage.buckets to anon, authenticated, service_role;
grant all on storage.objects to service_role;
grant select, insert, update, delete on storage.objects to authenticated;
grant select on storage.objects to anon;

-- Helper functions referenced by storage policies in various Supabase projects.
create or replace function storage.foldername(name text) returns text[]
  language sql immutable
as $$ select string_to_array(name, '/') $$;

create or replace function storage.filename(name text) returns text
  language sql immutable
as $$ select (string_to_array(name, '/'))[array_length(string_to_array(name, '/'), 1)] $$;

create or replace function storage.extension(name text) returns text
  language sql immutable
as $$ select (string_to_array((string_to_array(name, '/'))[array_length(string_to_array(name, '/'),1)], '.'))[2] $$;
