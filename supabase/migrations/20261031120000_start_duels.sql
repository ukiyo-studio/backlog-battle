-- Start Duels: short king-of-the-hill sessions plus a follow-through check.
-- Existing rows stay algorithm = 'knockout' and keep null context columns.

alter table public.battles drop constraint if exists battles_algorithm_check;

alter table public.battles
  add constraint battles_algorithm_check
  check (algorithm in ('knockout', 'start_duel'));

alter table public.battles alter column algorithm set default 'start_duel';

alter table public.battles
  add column context_time text,
  add column context_energy text,
  add column pick_item_id uuid references public.backlog_items (id) on delete restrict,
  add column runner_up_item_id uuid references public.backlog_items (id) on delete restrict,
  add column pool_fallback boolean not null default false;

alter table public.battles
  add constraint battles_context_time_check
    check (
      context_time is null
      or context_time in ('tonight', 'weekend', 'whenever')
    ),
  add constraint battles_context_energy_check
    check (
      context_energy is null
      or context_energy in ('low', 'medium', 'locked_in')
    ),
  add constraint battles_start_duel_context_check
    check (
      algorithm <> 'start_duel'
      or (context_time is not null and context_energy is not null)
    );

create index if not exists battles_pick_item_id_idx
  on public.battles (pick_item_id);

create index if not exists battles_runner_up_item_id_idx
  on public.battles (runner_up_item_id);

-- ---------------------------------------------------------------------------
-- start_checks
-- One follow-through row per Start Duel. outcome stays null until the user
-- answers. notified_at stops the hourly job from pushing the same check twice.
-- ---------------------------------------------------------------------------

create table if not exists public.start_checks (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid not null unique references public.battles (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  item_id uuid not null references public.backlog_items (id) on delete restrict,
  context_time text not null
    constraint start_checks_context_time_check
    check (context_time in ('tonight', 'weekend', 'whenever')),
  context_energy text not null
    constraint start_checks_context_energy_check
    check (context_energy in ('low', 'medium', 'locked_in')),
  outcome text
    constraint start_checks_outcome_check
    check (
      outcome is null
      or outcome in ('sticking', 'bounced', 'never_opened')
    ),
  due_at timestamptz not null,
  checked_at timestamptz,
  notified_at timestamptz,
  runner_up_swapped boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint start_checks_outcome_checked_check
    check (
      (outcome is null and checked_at is null)
      or (outcome is not null and checked_at is not null)
    )
);

create index if not exists start_checks_user_id_idx
  on public.start_checks (user_id);

create index if not exists start_checks_category_id_idx
  on public.start_checks (category_id);

create index if not exists start_checks_item_id_idx
  on public.start_checks (item_id);

create index if not exists start_checks_due_idx
  on public.start_checks (due_at)
  where outcome is null and notified_at is null;

alter table public.start_checks enable row level security;

drop trigger if exists set_start_checks_updated_at on public.start_checks;
create trigger set_start_checks_updated_at
  before update on public.start_checks
  for each row
  execute function public.set_updated_at();

drop policy if exists "Users can view own start checks" on public.start_checks;
create policy "Users can view own start checks"
  on public.start_checks for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own start checks" on public.start_checks;
create policy "Users can insert own start checks"
  on public.start_checks for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.battles b
      where b.id = battle_id
        and b.user_id = (select auth.uid())
        and b.category_id = category_id
    )
    and exists (
      select 1 from public.backlog_items i
      where i.id = item_id
        and i.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can update own start checks" on public.start_checks;
create policy "Users can update own start checks"
  on public.start_checks for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.backlog_items i
      where i.id = item_id
        and i.user_id = (select auth.uid())
    )
  );
