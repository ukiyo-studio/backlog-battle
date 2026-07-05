-- Backlog Battle — Phase 1 initial schema
-- Tables: profiles, categories, backlog_items
-- Battles/reminders tables arrive in later phases (Phase 3/4).

-- ---------------------------------------------------------------------------
-- updated_at trigger function
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Users can delete own profile" on public.profiles;
create policy "Users can delete own profile"
  on public.profiles for delete
  to authenticated
  using ((select auth.uid()) = id);

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists categories_user_id_idx
  on public.categories (user_id);

alter table public.categories enable row level security;

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
  before update on public.categories
  for each row
  execute function public.set_updated_at();

drop policy if exists "Users can view own categories" on public.categories;
create policy "Users can view own categories"
  on public.categories for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own categories" on public.categories;
create policy "Users can insert own categories"
  on public.categories for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own categories" on public.categories;
create policy "Users can update own categories"
  on public.categories for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own categories" on public.categories;
create policy "Users can delete own categories"
  on public.categories for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- backlog_items
-- ---------------------------------------------------------------------------

create table if not exists public.backlog_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  title text not null,
  description text,
  item_type text,
  status text not null default 'active'
    constraint backlog_items_status_check
    check (status in ('active', 'completed', 'archived', 'removed')),
  image_url text,
  external_source text,
  external_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists backlog_items_user_id_idx
  on public.backlog_items (user_id);

create index if not exists backlog_items_category_id_idx
  on public.backlog_items (category_id);

alter table public.backlog_items enable row level security;

drop trigger if exists set_backlog_items_updated_at on public.backlog_items;
create trigger set_backlog_items_updated_at
  before update on public.backlog_items
  for each row
  execute function public.set_updated_at();

drop policy if exists "Users can view own backlog items" on public.backlog_items;
create policy "Users can view own backlog items"
  on public.backlog_items for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own backlog items" on public.backlog_items;
create policy "Users can insert own backlog items"
  on public.backlog_items for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own backlog items" on public.backlog_items;
create policy "Users can update own backlog items"
  on public.backlog_items for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own backlog items" on public.backlog_items;
create policy "Users can delete own backlog items"
  on public.backlog_items for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Profile auto-creation on sign-up
-- ---------------------------------------------------------------------------

-- SECURITY DEFINER so the trigger (fired as supabase_auth_admin) can insert
-- into public.profiles. Empty search_path forces fully qualified names and
-- prevents search-path hijacking.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
