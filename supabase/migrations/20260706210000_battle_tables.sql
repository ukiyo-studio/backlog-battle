-- Backlog Battle — Phase 3 battle tables
-- Tables: battles, battle_matchups, battle_rankings
-- battles are created directly active (no 'draft' status). participant_item_ids
-- is the ordered post-shuffle snapshot of battling items and the source of
-- truth for bracket reconstruction. backlog_items referenced by matchups and
-- rankings use ON DELETE RESTRICT so hard deletes cannot break battle history
-- (the app only soft-deletes items via deleted_at).

-- ---------------------------------------------------------------------------
-- battles
-- ---------------------------------------------------------------------------

create table if not exists public.battles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  status text not null default 'active'
    constraint battles_status_check
    check (status in ('active', 'completed', 'abandoned')),
  algorithm text not null default 'knockout'
    constraint battles_algorithm_check
    check (algorithm in ('knockout')),
  -- cardinality() (not array_length()) so an empty array yields 0, not NULL —
  -- NULL check results pass in Postgres and would bypass the >= 2 rule.
  participant_item_ids uuid[] not null
    constraint battles_participant_count_check
    check (cardinality(participant_item_ids) >= 2),
  seed integer,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists battles_user_id_idx
  on public.battles (user_id);

create index if not exists battles_category_id_idx
  on public.battles (category_id);

alter table public.battles enable row level security;

drop trigger if exists set_battles_updated_at on public.battles;
create trigger set_battles_updated_at
  before update on public.battles
  for each row
  execute function public.set_updated_at();

drop policy if exists "Users can view own battles" on public.battles;
create policy "Users can view own battles"
  on public.battles for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own battles" on public.battles;
create policy "Users can insert own battles"
  on public.battles for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.categories c
      where c.id = category_id and c.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can update own battles" on public.battles;
create policy "Users can update own battles"
  on public.battles for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.categories c
      where c.id = category_id and c.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can delete own battles" on public.battles;
create policy "Users can delete own battles"
  on public.battles for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- battle_matchups
-- ---------------------------------------------------------------------------

create table if not exists public.battle_matchups (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid not null references public.battles (id) on delete cascade,
  round_number integer not null
    constraint battle_matchups_round_number_check
    check (round_number > 0),
  match_number integer not null
    constraint battle_matchups_match_number_check
    check (match_number > 0),
  item_a_id uuid not null references public.backlog_items (id) on delete restrict,
  item_b_id uuid not null references public.backlog_items (id) on delete restrict,
  constraint battle_matchups_distinct_items_check
    check (item_a_id <> item_b_id),
  winner_item_id uuid references public.backlog_items (id) on delete restrict
    constraint battle_matchups_winner_check
    check (winner_item_id is null or winner_item_id in (item_a_id, item_b_id)),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint battle_matchups_battle_round_match_key
    unique (battle_id, round_number, match_number)
);

create index if not exists battle_matchups_battle_id_idx
  on public.battle_matchups (battle_id);

alter table public.battle_matchups enable row level security;

drop trigger if exists set_battle_matchups_updated_at on public.battle_matchups;
create trigger set_battle_matchups_updated_at
  before update on public.battle_matchups
  for each row
  execute function public.set_updated_at();

-- No user_id column: ownership is derived from the parent battle.

drop policy if exists "Users can view own battle matchups" on public.battle_matchups;
create policy "Users can view own battle matchups"
  on public.battle_matchups for select
  to authenticated
  using (
    exists (
      select 1 from public.battles b
      where b.id = battle_id and b.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can insert own battle matchups" on public.battle_matchups;
create policy "Users can insert own battle matchups"
  on public.battle_matchups for insert
  to authenticated
  with check (
    exists (
      select 1 from public.battles b
      where b.id = battle_id and b.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can update own battle matchups" on public.battle_matchups;
create policy "Users can update own battle matchups"
  on public.battle_matchups for update
  to authenticated
  using (
    exists (
      select 1 from public.battles b
      where b.id = battle_id and b.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.battles b
      where b.id = battle_id and b.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can delete own battle matchups" on public.battle_matchups;
create policy "Users can delete own battle matchups"
  on public.battle_matchups for delete
  to authenticated
  using (
    exists (
      select 1 from public.battles b
      where b.id = battle_id and b.user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- battle_rankings
-- ---------------------------------------------------------------------------

create table if not exists public.battle_rankings (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid not null references public.battles (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  item_id uuid not null references public.backlog_items (id) on delete restrict,
  rank integer not null
    constraint battle_rankings_rank_check
    check (rank > 0),
  created_at timestamptz not null default now(),
  constraint battle_rankings_battle_rank_key
    unique (battle_id, rank),
  constraint battle_rankings_battle_item_key
    unique (battle_id, item_id)
);

create index if not exists battle_rankings_battle_id_idx
  on public.battle_rankings (battle_id);

create index if not exists battle_rankings_category_id_idx
  on public.battle_rankings (category_id);

alter table public.battle_rankings enable row level security;

-- No user_id column: ownership is derived from the parent battle.

drop policy if exists "Users can view own battle rankings" on public.battle_rankings;
create policy "Users can view own battle rankings"
  on public.battle_rankings for select
  to authenticated
  using (
    exists (
      select 1 from public.battles b
      where b.id = battle_id and b.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can insert own battle rankings" on public.battle_rankings;
create policy "Users can insert own battle rankings"
  on public.battle_rankings for insert
  to authenticated
  with check (
    exists (
      select 1 from public.battles b
      where b.id = battle_id and b.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can update own battle rankings" on public.battle_rankings;
create policy "Users can update own battle rankings"
  on public.battle_rankings for update
  to authenticated
  using (
    exists (
      select 1 from public.battles b
      where b.id = battle_id and b.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.battles b
      where b.id = battle_id and b.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can delete own battle rankings" on public.battle_rankings;
create policy "Users can delete own battle rankings"
  on public.battle_rankings for delete
  to authenticated
  using (
    exists (
      select 1 from public.battles b
      where b.id = battle_id and b.user_id = (select auth.uid())
    )
  );
