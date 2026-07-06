-- Backlog Battle — Phase 4 reminder infrastructure
-- Tables: reminder_settings, push_tokens
-- MVP uses global reminders only (category_id IS NULL).

-- ---------------------------------------------------------------------------
-- reminder_settings
-- ---------------------------------------------------------------------------

create table if not exists public.reminder_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete cascade,
  enabled boolean not null default false,
  frequency text not null default 'weekly'
    constraint reminder_settings_frequency_check
    check (frequency in ('weekly', 'biweekly', 'monthly')),
  next_reminder_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists reminder_settings_user_global_key
  on public.reminder_settings (user_id)
  where category_id is null;

create index if not exists reminder_settings_due_idx
  on public.reminder_settings (enabled, next_reminder_at)
  where enabled = true;

alter table public.reminder_settings enable row level security;

drop trigger if exists set_reminder_settings_updated_at on public.reminder_settings;
create trigger set_reminder_settings_updated_at
  before update on public.reminder_settings
  for each row
  execute function public.set_updated_at();

drop policy if exists "Users can view own reminder settings" on public.reminder_settings;
create policy "Users can view own reminder settings"
  on public.reminder_settings for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own reminder settings" on public.reminder_settings;
create policy "Users can insert own reminder settings"
  on public.reminder_settings for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own reminder settings" on public.reminder_settings;
create policy "Users can update own reminder settings"
  on public.reminder_settings for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own reminder settings" on public.reminder_settings;
create policy "Users can delete own reminder settings"
  on public.reminder_settings for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- push_tokens
-- ---------------------------------------------------------------------------

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token text not null,
  platform text not null
    constraint push_tokens_platform_check
    check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_tokens_token_key unique (token)
);

create index if not exists push_tokens_user_id_idx
  on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

drop trigger if exists set_push_tokens_updated_at on public.push_tokens;
create trigger set_push_tokens_updated_at
  before update on public.push_tokens
  for each row
  execute function public.set_updated_at();

drop policy if exists "Users can view own push tokens" on public.push_tokens;
create policy "Users can view own push tokens"
  on public.push_tokens for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own push tokens" on public.push_tokens;
create policy "Users can insert own push tokens"
  on public.push_tokens for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own push tokens" on public.push_tokens;
create policy "Users can update own push tokens"
  on public.push_tokens for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own push tokens" on public.push_tokens;
create policy "Users can delete own push tokens"
  on public.push_tokens for delete
  to authenticated
  using ((select auth.uid()) = user_id);
