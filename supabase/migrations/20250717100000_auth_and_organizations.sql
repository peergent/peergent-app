-- Sprint 5.1: Authentication & Organizations foundation
-- Run in Supabase SQL editor or via supabase db push

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'manager', 'member', 'viewer')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, user_id)
);

alter table public.peers
  add column if not exists organization_id uuid references public.organizations (id) on delete cascade;

create index if not exists peers_organization_id_idx
  on public.peers (organization_id);

create index if not exists organization_members_user_id_idx
  on public.organization_members (user_id);

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.peers enable row level security;

create or replace function public.is_org_member(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_org_id
      and om.user_id = auth.uid()
  );
$$;

create policy "Profiles are readable by owner"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Profiles are insertable by owner"
  on public.profiles
  for insert
  with check (auth.uid() = id);

create policy "Profiles are updatable by owner"
  on public.profiles
  for update
  using (auth.uid() = id);

create policy "Organizations readable by members"
  on public.organizations
  for select
  using (public.is_org_member(id));

create policy "Organizations insertable by authenticated users"
  on public.organizations
  for insert
  with check (auth.uid() is not null);

create policy "Organization members readable by members"
  on public.organization_members
  for select
  using (public.is_org_member(organization_id));

create policy "Organization members insertable by authenticated users"
  on public.organization_members
  for insert
  with check (auth.uid() = user_id);

create policy "Peers readable by organization members"
  on public.peers
  for select
  using (
    organization_id is not null
    and public.is_org_member(organization_id)
  );

create policy "Peers insertable by organization members"
  on public.peers
  for insert
  with check (
    organization_id is not null
    and public.is_org_member(organization_id)
  );

create policy "Peers updatable by organization members"
  on public.peers
  for update
  using (
    organization_id is not null
    and public.is_org_member(organization_id)
  );

create policy "Peers deletable by organization members"
  on public.peers
  for delete
  using (
    organization_id is not null
    and public.is_org_member(organization_id)
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  org_id uuid;
  org_name text;
  org_slug text;
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '')
  )
  on conflict (id) do update
  set full_name = excluded.full_name;

  org_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'organization_name'), ''),
    split_part(new.email, '@', 1) || '''s workspace'
  );

  org_slug := lower(regexp_replace(org_name, '[^a-z0-9]+', '-', 'g'));
  org_slug := trim(both '-' from org_slug);
  if org_slug = '' then
    org_slug := 'workspace';
  end if;
  org_slug := org_slug || '-' || substr(new.id::text, 1, 8);

  insert into public.organizations (name, slug)
  values (org_name, org_slug)
  returning id into org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (org_id, new.id, 'owner');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
